/**
 * Génère supabase/seed.sql à partir du jeu de données de démo (src/content/demo).
 * Usage : npm run db:seed:generate
 *
 * Une seule source de vérité : l'app en mode démo et la base Supabase affichent
 * exactement les mêmes contenus, avec les mêmes UUID.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { demoData } from "../src/content/demo";

type Val = string | number | boolean | null | undefined | string[] | object;

function lit(v: Val): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "null";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v) && v.some((x) => typeof x === "object" && x !== null)) {
    return `${lit(JSON.stringify(v))}::jsonb`;
  }
  if (Array.isArray(v)) {
    return `array[${v.map((x) => lit(x as string)).join(", ")}]::text[]`;
  }
  if (typeof v === "object") return `${lit(JSON.stringify(v))}::jsonb`;
  return `'${v.replace(/'/g, "''")}'`;
}

const pt = (p: { lat: number; lng: number }) =>
  `extensions.st_setsrid(extensions.st_makepoint(${p.lng}, ${p.lat}), 4326)::extensions.geography`;

const line = (path: [number, number][]) =>
  `extensions.st_setsrid(extensions.st_geomfromtext('LINESTRING(${path.map(([lng, lat]) => `${lng} ${lat}`).join(", ")})'), 4326)::extensions.geography`;

const bbox = ([sw, ne]: [{ lat: number; lng: number }, { lat: number; lng: number }]) =>
  `extensions.st_makeenvelope(${sw.lng}, ${sw.lat}, ${ne.lng}, ${ne.lat}, 4326)::extensions.geography`;

function insert(table: string, rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const values = rows.map((r) => `  (${cols.map((c) => r[c]).join(", ")})`).join(",\n");
  return `insert into public.${table} (${cols.join(", ")}) values\n${values};\n\n`;
}

function translations<T extends object>(
  table: string,
  fk: string,
  items: readonly { id: string; translations: Partial<Record<string, T>> }[],
  map: (t: T) => Record<string, Val>,
): string {
  const rows: Record<string, string>[] = [];
  for (const item of items) {
    for (const [locale, t] of Object.entries(item.translations)) {
      if (!t) continue;
      const mapped = map(t);
      rows.push({ [fk]: lit(item.id), locale: lit(locale), ...Object.fromEntries(Object.entries(mapped).map(([k, v]) => [k, lit(v)])) });
    }
  }
  // Les lignes n'ont pas toutes les mêmes colonnes optionnelles : on normalise.
  const allCols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return insert(table, rows.map((r) => Object.fromEntries(allCols.map((c) => [c, r[c] ?? "null"]))));
}

const d = demoData;
let sql = `-- ============================================================================
-- ParkQuest — SEED DE DÉMONSTRATION (généré, ne pas modifier à la main)
-- Source : src/content/demo/*  ·  Générateur : scripts/generate-seed.ts
--
-- ⚠️ Toutes ces données sont des DONNÉES DE DÉMONSTRATION (is_demo_data = true).
-- Elles ne doivent jamais être présentées comme officielles sans validation
-- et autorisation du parc concerné (voir docs/DEMO_DATA_VALIDATION.md).
-- ============================================================================

begin;

`;

// Parcs
sql += insert(
  "parks",
  d.parks.map((p) => ({
    id: lit(p.id),
    slug: lit(p.slug),
    type: lit(p.type),
    status: lit(p.status),
    is_demo_data: lit(p.isDemoData),
    country_code: lit(p.countryCode),
    city: lit(p.city),
    timezone: lit(p.timezone),
    default_locale: lit(p.defaultLocale),
    available_locales: lit(p.availableLocales),
    location: pt(p.location),
    boundary: bbox(p.bounds),
    default_zoom: lit(p.defaultZoom),
    brand_color: lit(p.brandColor),
    cover_image_url: lit(p.coverImageUrl),
    is_free: lit(p.isFree),
    is_pmr_friendly: lit(p.isPmrFriendly),
    tags: lit(p.tags),
  })),
);
sql += translations("park_translations", "park_id", d.parks, (t) => ({
  name: t.name,
  tagline: t.tagline,
  description: t.description,
  practical_notes: t.practicalNotes,
  accessibility_notes: t.accessibilityNotes,
  transport_notes: t.transportNotes,
  rules: t.rules,
}));
sql += insert(
  "park_practical_info",
  d.parks
    .filter((p) => p.practicalInfo)
    .map((p) => ({
      park_id: lit(p.id),
      address_line: lit(p.practicalInfo!.addressLine),
      postal_code: lit(p.practicalInfo!.postalCode),
      website_url: lit(p.practicalInfo!.websiteUrl),
      ticket_url: lit(p.practicalInfo!.ticketUrl),
      phone: lit(p.practicalInfo!.phone),
      opening_hours: lit(p.practicalInfo!.openingHours),
      prices: lit(p.practicalInfo!.prices.map((x) => ({ label_key: x.labelKey, amount: x.amount, currency: x.currency }))),
    })),
);

// Catégories
sql += insert(
  "spot_categories",
  d.spotCategories.map((c) => ({
    id: lit(c.id),
    park_id: lit(c.parkId),
    key: lit(c.key),
    icon: lit(c.icon),
    color: lit(c.color),
    sort_order: lit(c.sortOrder),
  })),
);
sql += translations("spot_category_translations", "category_id", d.spotCategories, (t) => ({ name: t.name }));

// Spots
sql += insert(
  "spots",
  d.spots.map((s) => ({
    id: lit(s.id),
    park_id: lit(s.parkId),
    slug: lit(s.slug),
    kind: lit(s.kind),
    status: lit(s.status),
    is_demo_data: lit(s.isDemoData),
    location: pt(s.location),
    discovery_radius_m: lit(s.discoveryRadiusM),
    scientific_name: lit(s.scientificName),
    facts: lit({
      origin_key: s.facts.originKey,
      planted_year: s.facts.plantedYear,
      height_m: s.facts.heightM,
      girth_m: s.facts.girthM,
      bloom_months: s.facts.bloomMonths,
      built_year: s.facts.builtYear,
    }),
    cover_image_url: lit(s.coverImageUrl),
    is_pmr_accessible: lit(s.isPmrAccessible),
    points_value: lit(s.pointsValue),
    sort_order: lit(s.sortOrder),
  })),
);
sql += translations("spot_translations", "spot_id", d.spots, (t) => ({
  name: t.name,
  label: t.label,
  summary: t.summary,
  about: t.about,
  fun_fact: t.funFact,
  directions: t.directions,
  origin: t.origin,
}));
sql += insert(
  "spot_category_relations",
  d.spots.flatMap((s) =>
    s.categoryKeys.map((k) => ({
      spot_id: lit(s.id),
      category_id: lit(d.spotCategories.find((c) => c.key === k)!.id),
    })),
  ),
);

// Parcours
sql += insert(
  "trails",
  d.trails.map((t) => ({
    id: lit(t.id),
    park_id: lit(t.parkId),
    slug: lit(t.slug),
    status: lit(t.status),
    is_demo_data: lit(t.isDemoData),
    difficulty: lit(t.difficulty),
    duration_min: lit(t.durationMin),
    distance_m: lit(t.distanceM),
    audiences: lit(t.audiences),
    themes: lit(t.themes),
    is_pmr_accessible: lit(t.isPmrAccessible),
    pmr_partial: lit(t.pmrPartial),
    cover_image_url: lit(t.coverImageUrl),
    completion_points: lit(t.completionPoints),
    sort_order: lit(t.sortOrder),
  })),
);
sql += translations("trail_translations", "trail_id", d.trails, (t) => ({
  name: t.name,
  summary: t.summary,
  description: t.description,
  accessibility_notes: t.accessibilityNotes,
}));
sql += insert(
  "trail_spots",
  d.trails.flatMap((t) => t.spotIds.map((sid, i) => ({ trail_id: lit(t.id), spot_id: lit(sid), position: lit(i + 1) }))),
);
const segments = d.trails.flatMap((t) => t.segments.map((s) => ({ ...s, trailId: t.id })));
sql += insert(
  "trail_segments",
  segments.map((s) => ({
    id: lit(s.id),
    trail_id: lit(s.trailId),
    from_spot_id: lit(s.fromSpotId),
    to_spot_id: lit(s.toSpotId),
    position: lit(s.position),
    geometry: line(s.path),
  })),
);
sql += translations("trail_segment_translations", "segment_id", segments, (t) => ({ instruction: t.instruction }));

// Services
sql += insert(
  "facilities",
  d.facilities.map((f) => ({
    id: lit(f.id),
    park_id: lit(f.parkId),
    type: lit(f.type),
    status: lit(f.status),
    is_demo_data: lit(f.isDemoData),
    location: pt(f.location),
    is_pmr_accessible: lit(f.isPmrAccessible),
    details: lit(f.details),
    sort_order: lit(f.sortOrder),
  })),
);
sql += translations("facility_translations", "facility_id", d.facilities, (t) => ({ name: t.name, description: t.description }));

// Quiz
sql += insert(
  "quizzes",
  d.quizzes.map((q) => ({
    id: lit(q.id),
    park_id: lit(q.parkId),
    spot_id: lit(q.spotId),
    status: lit(q.status),
    is_demo_data: lit(q.isDemoData),
    points_value: lit(q.pointsValue),
    sort_order: lit(q.sortOrder),
  })),
);
sql += translations("quiz_translations", "quiz_id", d.quizzes, (t) => ({ question: t.question, explanation: t.explanation }));
const answers = d.quizzes.flatMap((q) => q.answers.map((a) => ({ ...a, quizId: q.id })));
sql += insert(
  "quiz_answers",
  answers.map((a) => ({ id: lit(a.id), quiz_id: lit(a.quizId), is_correct: lit(a.isCorrect), position: lit(a.position) })),
);
sql += translations("quiz_answer_translations", "answer_id", answers, (t) => ({ label: t.label }));

// Défis
sql += insert(
  "challenges",
  d.challenges.map((c) => ({
    id: lit(c.id),
    park_id: lit(c.parkId),
    spot_id: lit(c.spotId),
    type: lit(c.type),
    status: lit(c.status),
    is_demo_data: lit(c.isDemoData),
    requires_photo: lit(c.requiresPhoto),
    points_value: lit(c.pointsValue),
    target_value: lit(c.targetValue),
    sort_order: lit(c.sortOrder),
  })),
);
sql += translations("challenge_translations", "challenge_id", d.challenges, (t) => ({ title: t.title, instructions: t.instructions }));

// Badges
sql += insert(
  "badges",
  d.badges.map((b) => ({
    id: lit(b.id),
    park_id: lit(b.parkId),
    key: lit(b.key),
    icon: lit(b.icon),
    criteria: lit(b.criteria),
    threshold: lit(b.threshold),
    sort_order: lit(b.sortOrder),
  })),
);
sql += translations("badge_translations", "badge_id", d.badges, (t) => ({ name: t.name, description: t.description }));

// Articles
sql += insert(
  "article_categories",
  d.articleCategories.map((c) => ({ id: lit(c.id), key: lit(c.key), sort_order: lit(c.sortOrder) })),
);
sql += insert(
  "articles",
  d.articles.map((a) => ({
    id: lit(a.id),
    park_id: lit(a.parkId),
    category_id: lit(d.articleCategories.find((c) => c.key === a.categoryKey)!.id),
    slug: lit(a.slug),
    status: lit(a.status),
    is_demo_data: lit(a.isDemoData),
    cover_image_url: lit(a.coverImageUrl),
    reading_minutes: lit(a.readingMinutes),
    published_at: lit(a.publishedAt),
  })),
);
sql += translations("article_translations", "article_id", d.articles, (t) => ({ title: t.title, excerpt: t.excerpt, body_md: t.bodyMd }));

sql += "commit;\n";

const out = resolve(__dirname, "../supabase/seed.sql");
writeFileSync(out, sql);
console.log(`seed.sql généré (${(sql.length / 1024).toFixed(1)} Ko) → ${out}`);
