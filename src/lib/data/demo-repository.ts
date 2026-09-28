import "server-only";
import { demoData } from "@/features/demo/demo-data";
import type {
  SpotPhoto,
  Article,
  ArticleRecord,
  ArticleSummary,
  Badge,
  Challenge,
  Facility,
  Park,
  ParkRecord,
  ParkSummary,
  PublicQuiz,
  Spot,
  SpotCategory,
  SpotRecord,
  SpotSummary,
  Trail,
  TrailRecord,
  TrailSummary,
} from "@/lib/domain/types";
import { pickTranslation } from "@/lib/i18n-content";
import { rankNearby } from "@/lib/nearby";
import type { ContentRepository } from "./repository";

const published = <T extends { status: string }>(x: T) => x.status === "PUBLISHED";

function parkDefaultLocale(parkId: string | null): string {
  return demoData.parks.find((p) => p.id === parkId)?.defaultLocale ?? "en";
}

function toParkSummary(p: ParkRecord, locale: string): ParkSummary {
  const t = pickTranslation(p.translations, locale, p.defaultLocale);
  return {
    id: p.id,
    slug: p.slug,
    type: p.type,
    isDemoData: p.isDemoData,
    countryCode: p.countryCode,
    city: p.city,
    location: p.location,
    coverImageUrl: p.coverImageUrl,
    name: t?.value.name ?? p.slug,
    tagline: t?.value.tagline,
    isFree: p.isFree,
    isPmrFriendly: p.isPmrFriendly,
    tags: p.tags,
    availableLocales: p.availableLocales,
    contentLocale: t?.locale ?? locale,
    trailCount: demoData.trails.filter((x) => x.parkId === p.id && published(x)).length,
    spotCount: demoData.spots.filter((x) => x.parkId === p.id && published(x)).length,
  };
}

export function toSpotSummary(s: SpotRecord, locale: string): SpotSummary {
  const t = pickTranslation(s.translations, locale, parkDefaultLocale(s.parkId));
  return {
    id: s.id,
    parkId: s.parkId,
    slug: s.slug,
    kind: s.kind,
    isDemoData: s.isDemoData,
    location: s.location,
    coverImageUrl: s.coverImageUrl,
    name: t?.value.name ?? s.slug,
    label: t?.value.label,
    summary: t?.value.summary,
    scientificName: s.scientificName,
    pointsValue: s.pointsValue,
    categoryKeys: s.categoryKeys,
    contentLocale: t?.locale ?? locale,
  };
}

function toTrailSummary(t: TrailRecord, locale: string): TrailSummary {
  const tr = pickTranslation(t.translations, locale, parkDefaultLocale(t.parkId));
  return {
    id: t.id,
    parkId: t.parkId,
    slug: t.slug,
    isDemoData: t.isDemoData,
    difficulty: t.difficulty,
    durationMin: t.durationMin,
    distanceM: t.distanceM,
    audiences: t.audiences,
    themes: t.themes,
    isPmrAccessible: t.isPmrAccessible,
    pmrPartial: t.pmrPartial,
    coverImageUrl: t.coverImageUrl,
    completionPoints: t.completionPoints,
    name: tr?.value.name ?? t.slug,
    summary: tr?.value.summary,
    spotCount: t.spotIds.length,
    contentLocale: tr?.locale ?? locale,
  };
}

function toArticleSummary(a: ArticleRecord, locale: string): ArticleSummary {
  const t = pickTranslation(a.translations, locale, parkDefaultLocale(a.parkId));
  return {
    id: a.id,
    slug: a.slug,
    categoryKey: a.categoryKey,
    isDemoData: a.isDemoData,
    coverImageUrl: a.coverImageUrl,
    readingMinutes: a.readingMinutes,
    publishedAt: a.publishedAt,
    title: t?.value.title ?? a.slug,
    excerpt: t?.value.excerpt,
    contentLocale: t?.locale ?? locale,
  };
}

export const demoRepository: ContentRepository = {
  source: "demo",

  async listParks(locale) {
    return demoData.parks.filter(published).map((p) => toParkSummary(p, locale));
  },

  async getPark(slug, locale): Promise<Park | null> {
    const p = demoData.parks.find((x) => x.slug === slug && published(x));
    if (!p) return null;
    const t = pickTranslation(p.translations, locale, p.defaultLocale);
    return {
      ...toParkSummary(p, locale),
      timezone: p.timezone,
      defaultLocale: p.defaultLocale,
      bounds: p.bounds,
      defaultZoom: p.defaultZoom,
      brandColor: p.brandColor,
      description: t?.value.description,
      practicalNotes: t?.value.practicalNotes,
      accessibilityNotes: t?.value.accessibilityNotes,
      transportNotes: t?.value.transportNotes,
      rules: t?.value.rules,
      practicalInfo: p.practicalInfo,
      badgeCount: demoData.badges.filter((b) => b.parkId === null || b.parkId === p.id).length,
    };
  },

  async listCategories(locale): Promise<SpotCategory[]> {
    return demoData.spotCategories.map((c) => ({
      key: c.key,
      icon: c.icon,
      color: c.color,
      name: pickTranslation(c.translations, locale)?.value.name ?? c.key,
    }));
  },

  async listSpots(parkId, locale) {
    return demoData.spots
      .filter((s) => s.parkId === parkId && published(s))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => toSpotSummary(s, locale));
  },

  async listNearbySpots(parkId, origin, radiusM, locale) {
    const spots = await demoRepository.listSpots(parkId, locale);
    return rankNearby(
      spots.map((s) => ({ ...s, kind: "spot" as const, spotKind: s.kind })),
      origin,
      radiusM,
      30,
    ).map(({ item, distanceM }) => {
      const { spotKind, ...rest } = item;
      return { ...rest, kind: spotKind, distanceM };
    });
  },

  async listSpotPhotos(): Promise<SpotPhoto[]> {
    // Démo : aucune photo réelle n'est inventée ; les photos proposées restent sur l'appareil.
    return [];
  },

  async getSpot(parkId, spotSlug, locale): Promise<Spot | null> {
    const s = demoData.spots.find((x) => x.parkId === parkId && x.slug === spotSlug && published(x));
    if (!s) return null;
    const t = pickTranslation(s.translations, locale, parkDefaultLocale(parkId));
    return {
      ...toSpotSummary(s, locale),
      discoveryRadiusM: s.discoveryRadiusM,
      facts: s.facts,
      isPmrAccessible: s.isPmrAccessible,
      about: t?.value.about,
      funFact: t?.value.funFact,
      directions: t?.value.directions,
      origin: t?.value.origin,
    };
  },

  async listTrails(parkId, locale) {
    return demoData.trails
      .filter((t) => t.parkId === parkId && published(t))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((t) => toTrailSummary(t, locale));
  },

  async getTrail(parkId, trailSlug, locale): Promise<Trail | null> {
    const t = demoData.trails.find((x) => x.parkId === parkId && x.slug === trailSlug && published(x));
    if (!t) return null;
    const tr = pickTranslation(t.translations, locale, parkDefaultLocale(parkId));
    const spots = t.spotIds
      .map((id) => demoData.spots.find((s) => s.id === id))
      .filter((s): s is SpotRecord => Boolean(s && published(s)))
      .map((s) => toSpotSummary(s, locale));
    return {
      ...toTrailSummary(t, locale),
      description: tr?.value.description,
      accessibilityNotes: tr?.value.accessibilityNotes,
      start: t.start,
      spots,
      segments: t.segments.map((sg) => ({
        id: sg.id,
        fromSpotId: sg.fromSpotId,
        toSpotId: sg.toSpotId,
        position: sg.position,
        path: sg.path,
        instruction: pickTranslation(sg.translations, locale, parkDefaultLocale(parkId))?.value.instruction,
      })),
    };
  },

  async listFacilities(parkId, locale): Promise<Facility[]> {
    return demoData.facilities
      .filter((f) => f.parkId === parkId && published(f))
      .map((f) => {
        const t = pickTranslation(f.translations, locale, parkDefaultLocale(parkId));
        return {
          id: f.id,
          type: f.type,
          isDemoData: f.isDemoData,
          location: f.location,
          isPmrAccessible: f.isPmrAccessible,
          details: f.details,
          name: t?.value.name ?? f.type,
          description: t?.value.description,
          contentLocale: t?.locale ?? locale,
        };
      });
  },

  async listQuizzesForSpot(spotId, locale): Promise<PublicQuiz[]> {
    return demoData.quizzes
      .filter((q) => q.spotId === spotId && published(q))
      .map((q) => {
        const t = pickTranslation(q.translations, locale, parkDefaultLocale(q.parkId));
        return {
          id: q.id,
          spotId: q.spotId,
          pointsValue: q.pointsValue,
          question: t?.value.question ?? "",
          contentLocale: t?.locale ?? locale,
          // ⚠️ jamais isCorrect ici
          answers: [...q.answers]
            .sort((a, b) => a.position - b.position)
            .map((a) => ({
              id: a.id,
              label: pickTranslation(a.translations, locale, parkDefaultLocale(q.parkId))?.value.label ?? "",
            })),
        };
      });
  },

  async listChallenges(parkId, locale, spotId): Promise<Challenge[]> {
    return demoData.challenges
      .filter((c) => c.parkId === parkId && published(c) && (spotId === undefined || c.spotId === spotId))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => {
        const t = pickTranslation(c.translations, locale, parkDefaultLocale(parkId));
        return {
          id: c.id,
          spotId: c.spotId,
          type: c.type,
          requiresPhoto: c.requiresPhoto,
          pointsValue: c.pointsValue,
          targetValue: c.targetValue,
          title: t?.value.title ?? "",
          instructions: t?.value.instructions,
          contentLocale: t?.locale ?? locale,
        };
      });
  },

  async listBadges(locale): Promise<Badge[]> {
    return demoData.badges.map((b) => {
      const t = pickTranslation(b.translations, locale);
      return {
        id: b.id,
        key: b.key,
        icon: b.icon,
        criteria: b.criteria,
        threshold: b.threshold,
        name: t?.value.name ?? b.key,
        description: t?.value.description,
        contentLocale: t?.locale ?? locale,
      };
    });
  },

  async listArticles(locale) {
    return demoData.articles
      .filter(published)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .map((a) => toArticleSummary(a, locale));
  },

  async getArticle(slug, locale): Promise<Article | null> {
    const a = demoData.articles.find((x) => x.slug === slug && published(x));
    if (!a) return null;
    return { ...toArticleSummary(a, locale), bodyMd: pickTranslation(a.translations, locale)?.value.bodyMd };
  },
};
