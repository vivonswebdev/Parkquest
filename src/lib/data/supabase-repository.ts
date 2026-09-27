import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Article,
  ArticleSummary,
  Badge,
  Challenge,
  Facility,
  LatLng,
  Park,
  ParkSummary,
  PublicQuiz,
  Spot,
  SpotCategory,
  SpotSummary,
  Trail,
  TrailSummary,
} from "@/lib/domain/types";
import { pickRow as pickRowBase } from "@/lib/i18n-content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentRepository } from "./repository";

/* eslint-disable @typescript-eslint/no-explicit-any -- lignes PostgREST non typées (générer les types avec `npm run db:types`) */
type Row = Record<string, any>;
const pickRow = (rows: Row[] | null | undefined, locale: string, parkLocale?: string): Row | null =>
  pickRowBase(rows as (Row & { locale: string })[] | null | undefined, locale, parkLocale);

async function db(): Promise<SupabaseClient> {
  const c = await createSupabaseServerClient();
  if (!c) throw new Error("Supabase non configuré");
  return c;
}

const PUBLISHED = "PUBLISHED";

function boundsFromGeoJson(g: Row | null, fallback: LatLng): [LatLng, LatLng] {
  const ring: [number, number][] | undefined = g?.coordinates?.[0];
  if (!ring?.length) {
    const d = 0.006;
    return [
      { lat: fallback.lat - d, lng: fallback.lng - d },
      { lat: fallback.lat + d, lng: fallback.lng + d },
    ];
  }
  const lngs = ring.map((c) => c[0]);
  const lats = ring.map((c) => c[1]);
  return [
    { lat: Math.min(...lats), lng: Math.min(...lngs) },
    { lat: Math.max(...lats), lng: Math.max(...lngs) },
  ];
}

const PARK_SUMMARY_COLS =
  "id, slug, type, is_demo_data, country_code, city, latitude, longitude, cover_image_url, is_free, is_pmr_friendly, tags, available_locales, default_locale, park_translations(*), spots(count), trails(count)";

function mapParkSummary(r: Row, locale: string): ParkSummary {
  const t = pickRow(r.park_translations, locale, r.default_locale);
  return {
    id: r.id,
    slug: r.slug,
    type: r.type,
    isDemoData: r.is_demo_data,
    countryCode: r.country_code,
    city: r.city,
    location: { lat: r.latitude, lng: r.longitude },
    coverImageUrl: r.cover_image_url ?? "/demo/parks/placeholder.svg",
    name: t?.name ?? r.slug,
    tagline: t?.tagline ?? undefined,
    isFree: r.is_free ?? undefined,
    isPmrFriendly: r.is_pmr_friendly ?? undefined,
    tags: r.tags ?? [],
    availableLocales: r.available_locales ?? [],
    contentLocale: t?.locale ?? locale,
    spotCount: r.spots?.[0]?.count ?? 0,
    trailCount: r.trails?.[0]?.count ?? 0,
  };
}

function mapSpotSummary(r: Row, locale: string, parkLocale = "en"): SpotSummary {
  const t = pickRow(r.spot_translations, locale, parkLocale);
  return {
    id: r.id,
    parkId: r.park_id,
    slug: r.slug,
    kind: r.kind,
    isDemoData: r.is_demo_data,
    location: { lat: r.latitude, lng: r.longitude },
    coverImageUrl: r.cover_image_url ?? "/demo/spots/placeholder.svg",
    name: t?.name ?? r.slug,
    label: t?.label ?? undefined,
    summary: t?.summary ?? undefined,
    scientificName: r.scientific_name ?? undefined,
    pointsValue: r.points_value,
    categoryKeys: (r.spot_category_relations ?? []).map((x: Row) => x.spot_categories?.key).filter(Boolean),
    contentLocale: t?.locale ?? locale,
  };
}

const SPOT_COLS =
  "id, park_id, slug, kind, is_demo_data, latitude, longitude, cover_image_url, scientific_name, points_value, discovery_radius_m, facts, is_pmr_accessible, sort_order, spot_translations(*), spot_category_relations(spot_categories(key))";

function mapTrailSummary(r: Row, locale: string): TrailSummary {
  const t = pickRow(r.trail_translations, locale);
  return {
    id: r.id,
    parkId: r.park_id,
    slug: r.slug,
    isDemoData: r.is_demo_data,
    difficulty: r.difficulty,
    durationMin: r.duration_min,
    distanceM: r.distance_m,
    audiences: r.audiences ?? [],
    themes: r.themes ?? [],
    isPmrAccessible: r.is_pmr_accessible ?? undefined,
    pmrPartial: r.pmr_partial,
    coverImageUrl: r.cover_image_url ?? "/demo/trails/placeholder.svg",
    completionPoints: r.completion_points,
    name: t?.name ?? r.slug,
    summary: t?.summary ?? undefined,
    spotCount: r.trail_spots?.[0]?.count ?? r.trail_spots?.length ?? 0,
    contentLocale: t?.locale ?? locale,
  };
}

function mapArticleSummary(r: Row, locale: string): ArticleSummary {
  const t = pickRow(r.article_translations, locale);
  return {
    id: r.id,
    slug: r.slug,
    categoryKey: r.article_categories?.key ?? "tips",
    isDemoData: r.is_demo_data,
    coverImageUrl: r.cover_image_url ?? "/demo/trails/placeholder.svg",
    readingMinutes: r.reading_minutes,
    publishedAt: r.published_at,
    title: t?.title ?? r.slug,
    excerpt: t?.excerpt ?? undefined,
    contentLocale: t?.locale ?? locale,
  };
}

export const supabaseRepository: ContentRepository = {
  source: "supabase",

  async listParks(locale) {
    const { data, error } = await (await db()).from("parks").select(PARK_SUMMARY_COLS).eq("status", PUBLISHED);
    if (error) throw error;
    return (data ?? []).map((r) => mapParkSummary(r, locale));
  },

  async getPark(slug, locale): Promise<Park | null> {
    const client = await db();
    const { data: r, error } = await client
      .from("parks")
      .select(`${PARK_SUMMARY_COLS}, timezone, default_zoom, brand_color, bounds_geojson, park_practical_info(*)`)
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!r) return null;
    const { count } = await client.from("badges").select("id", { count: "exact", head: true }).or(`park_id.is.null,park_id.eq.${r.id}`);
    const t = pickRow(r.park_translations as Row[], locale, r.default_locale);
    const pi = (r.park_practical_info as Row | Row[] | null);
    const info = Array.isArray(pi) ? pi[0] : pi;
    const summary = mapParkSummary(r, locale);
    return {
      ...summary,
      timezone: r.timezone,
      defaultLocale: r.default_locale,
      bounds: boundsFromGeoJson(r.bounds_geojson, summary.location),
      defaultZoom: Number(r.default_zoom),
      brandColor: r.brand_color ?? undefined,
      description: t?.description ?? undefined,
      practicalNotes: t?.practical_notes ?? undefined,
      accessibilityNotes: t?.accessibility_notes ?? undefined,
      transportNotes: t?.transport_notes ?? undefined,
      rules: t?.rules ?? undefined,
      badgeCount: count ?? 0,
      practicalInfo: info
        ? {
            addressLine: info.address_line ?? undefined,
            postalCode: info.postal_code ?? undefined,
            websiteUrl: info.website_url ?? undefined,
            ticketUrl: info.ticket_url ?? undefined,
            phone: info.phone ?? undefined,
            openingHours: info.opening_hours ?? [],
            prices: (info.prices ?? []).map((p: Row) => ({ labelKey: p.label_key, amount: p.amount, currency: p.currency })),
          }
        : undefined,
    };
  },

  async listCategories(locale): Promise<SpotCategory[]> {
    const { data, error } = await (await db())
      .from("spot_categories")
      .select("key, icon, color, spot_category_translations(*)")
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r: Row) => ({
      key: r.key,
      icon: r.icon,
      color: r.color ?? "#19E6A2",
      name: pickRow(r.spot_category_translations, locale)?.name ?? r.key,
    }));
  },

  async listSpots(parkId, locale) {
    const { data, error } = await (await db())
      .from("spots")
      .select(SPOT_COLS)
      .eq("park_id", parkId)
      .eq("status", PUBLISHED)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r) => mapSpotSummary(r, locale));
  },

  async getSpot(parkId, spotSlug, locale): Promise<Spot | null> {
    const { data: r, error } = await (await db())
      .from("spots")
      .select(SPOT_COLS)
      .eq("park_id", parkId)
      .eq("slug", spotSlug)
      .eq("status", PUBLISHED)
      .maybeSingle();
    if (error) throw error;
    if (!r) return null;
    const t = pickRow(r.spot_translations as Row[], locale);
    const f = (r.facts ?? {}) as Row;
    return {
      ...mapSpotSummary(r, locale),
      discoveryRadiusM: r.discovery_radius_m,
      isPmrAccessible: r.is_pmr_accessible ?? undefined,
      facts: {
        originKey: f.origin_key,
        plantedYear: f.planted_year,
        heightM: f.height_m,
        girthM: f.girth_m,
        bloomMonths: f.bloom_months,
        builtYear: f.built_year,
      },
      about: t?.about ?? undefined,
      funFact: t?.fun_fact ?? undefined,
      directions: t?.directions ?? undefined,
      origin: t?.origin ?? undefined,
    };
  },

  async listTrails(parkId, locale) {
    const { data, error } = await (await db())
      .from("trails")
      .select("*, trail_translations(*), trail_spots(count)")
      .eq("park_id", parkId)
      .eq("status", PUBLISHED)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r) => mapTrailSummary(r, locale));
  },

  async getTrail(parkId, trailSlug, locale): Promise<Trail | null> {
    const { data: r, error } = await (await db())
      .from("trails")
      .select(`*, trail_translations(*), trail_spots(position, spots(${SPOT_COLS})), trail_segments(id, from_spot_id, to_spot_id, position, path_geojson, trail_segment_translations(*))`)
      .eq("park_id", parkId)
      .eq("slug", trailSlug)
      .eq("status", PUBLISHED)
      .maybeSingle();
    if (error) throw error;
    if (!r) return null;
    const t = pickRow(r.trail_translations as Row[], locale);
    const spots = ((r.trail_spots ?? []) as Row[])
      .sort((a, b) => a.position - b.position)
      .filter((x) => x.spots)
      .map((x) => mapSpotSummary(x.spots, locale));
    const segments = ((r.trail_segments ?? []) as Row[])
      .sort((a, b) => a.position - b.position)
      .map((s) => ({
        id: s.id,
        fromSpotId: s.from_spot_id,
        toSpotId: s.to_spot_id,
        position: s.position,
        path: (s.path_geojson?.coordinates ?? []) as [number, number][],
        instruction: pickRow(s.trail_segment_translations, locale)?.instruction ?? undefined,
      }));
    const first = segments[0]?.path[0];
    return {
      ...mapTrailSummary({ ...r, trail_spots: r.trail_spots }, locale),
      spotCount: spots.length,
      description: t?.description ?? undefined,
      accessibilityNotes: t?.accessibility_notes ?? undefined,
      start: first ? { lng: first[0], lat: first[1] } : spots[0]?.location ?? { lat: 0, lng: 0 },
      spots,
      segments,
    };
  },

  async listFacilities(parkId, locale): Promise<Facility[]> {
    const { data, error } = await (await db())
      .from("facilities")
      .select("id, type, is_demo_data, latitude, longitude, is_pmr_accessible, details, facility_translations(*)")
      .eq("park_id", parkId)
      .eq("status", PUBLISHED)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r: Row) => {
      const t = pickRow(r.facility_translations, locale);
      return {
        id: r.id,
        type: r.type,
        isDemoData: r.is_demo_data,
        location: { lat: r.latitude, lng: r.longitude },
        isPmrAccessible: r.is_pmr_accessible ?? undefined,
        details: r.details ?? {},
        name: t?.name ?? r.type,
        description: t?.description ?? undefined,
        contentLocale: t?.locale ?? locale,
      };
    });
  },

  async listQuizzesForSpot(spotId, locale): Promise<PublicQuiz[]> {
    // Colonnes explicites : is_correct n'est de toute façon pas lisible (privilèges de colonnes).
    const { data, error } = await (await db())
      .from("quizzes")
      .select("id, spot_id, points_value, quiz_translations(*), quiz_answers(id, position, quiz_answer_translations(*))")
      .eq("spot_id", spotId)
      .eq("status", PUBLISHED)
      .order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r: Row) => {
      const t = pickRow(r.quiz_translations, locale);
      return {
        id: r.id,
        spotId: r.spot_id,
        pointsValue: r.points_value,
        question: t?.question ?? "",
        contentLocale: t?.locale ?? locale,
        answers: ((r.quiz_answers ?? []) as Row[])
          .sort((a, b) => a.position - b.position)
          .map((a) => ({ id: a.id, label: pickRow(a.quiz_answer_translations, locale)?.label ?? "" })),
      };
    });
  },

  async listChallenges(parkId, locale, spotId): Promise<Challenge[]> {
    let q = (await db())
      .from("challenges")
      .select("id, spot_id, type, requires_photo, points_value, target_value, challenge_translations(*)")
      .eq("park_id", parkId)
      .eq("status", PUBLISHED)
      .order("sort_order");
    if (spotId) q = q.eq("spot_id", spotId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((r: Row) => {
      const t = pickRow(r.challenge_translations, locale);
      return {
        id: r.id,
        spotId: r.spot_id,
        type: r.type,
        requiresPhoto: r.requires_photo,
        pointsValue: r.points_value,
        targetValue: r.target_value ?? undefined,
        title: t?.title ?? "",
        instructions: t?.instructions ?? undefined,
        contentLocale: t?.locale ?? locale,
      };
    });
  },

  async listBadges(locale): Promise<Badge[]> {
    const { data, error } = await (await db()).from("badges").select("*, badge_translations(*)").order("sort_order");
    if (error) throw error;
    return (data ?? []).map((r: Row) => {
      const t = pickRow(r.badge_translations, locale);
      return {
        id: r.id,
        key: r.key,
        icon: r.icon,
        criteria: r.criteria,
        threshold: r.threshold,
        name: t?.name ?? r.key,
        description: t?.description ?? undefined,
        contentLocale: t?.locale ?? locale,
      };
    });
  },

  async listArticles(locale) {
    const { data, error } = await (await db())
      .from("articles")
      .select("*, article_translations(*), article_categories(key)")
      .eq("status", PUBLISHED)
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r) => mapArticleSummary(r, locale));
  },

  async getArticle(slug, locale): Promise<Article | null> {
    const { data: r, error } = await (await db())
      .from("articles")
      .select("*, article_translations(*), article_categories(key)")
      .eq("slug", slug)
      .eq("status", PUBLISHED)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!r) return null;
    return { ...mapArticleSummary(r, locale), bodyMd: pickRow(r.article_translations as Row[], locale)?.body_md ?? undefined };
  },
};
