/**
 * Données plateforme de démonstration : autres parcs (vitrine), catégories,
 * badges et articles. ⚠️ Toutes ces données sont des EXEMPLES non validés.
 */
import type {
  ArticleCategoryRecord,
  ArticleRecord,
  BadgeRecord,
  ParkRecord,
  SpotCategoryRecord,
} from "@/lib/domain/types";
import { demoId } from "./ids";

// ---------------------------------------------------------------------------
// Parcs vitrine (aucun contenu détaillé : « bientôt disponible »)
// ---------------------------------------------------------------------------

function showcasePark(
  n: number,
  p: Pick<ParkRecord, "slug" | "type" | "countryCode" | "city" | "timezone" | "defaultLocale" | "location" | "coverImageUrl" | "isFree" | "isPmrFriendly" | "tags" | "translations"> & {
    availableLocales?: string[];
  },
): ParkRecord {
  const d = 0.006;
  return {
    id: demoId("park", n),
    status: "PUBLISHED",
    isDemoData: true,
    availableLocales: p.availableLocales ?? ["en"],
    bounds: [
      { lat: p.location.lat - d, lng: p.location.lng - d * 1.6 },
      { lat: p.location.lat + d, lng: p.location.lng + d * 1.6 },
    ],
    defaultZoom: 14.5,
    ...p,
  };
}

export const showcaseParks: ParkRecord[] = [
  showcasePark(2, {
    slug: "central-park",
    type: "URBAN_PARK",
    countryCode: "US",
    city: "New York",
    timezone: "America/New_York",
    defaultLocale: "en",
    availableLocales: ["en", "es"],
    location: { lat: 40.7829, lng: -73.9654 },
    coverImageUrl: "/demo/parks/central-park.svg",
    isFree: true,
    isPmrFriendly: true,
    tags: ["urban", "family", "photo", "free"],
    translations: {
      en: { name: "Central Park", tagline: "Urban park · New York, USA" },
      fr: { name: "Central Park", tagline: "Parc urbain · New York, États-Unis" },
      nl: { name: "Central Park", tagline: "Stadspark · New York, VS" },
    },
  }),
  showcasePark(3, {
    slug: "kew-gardens",
    type: "BOTANICAL_GARDEN",
    countryCode: "GB",
    city: "London",
    timezone: "Europe/London",
    defaultLocale: "en",
    location: { lat: 51.4787, lng: -0.2956 },
    coverImageUrl: "/demo/parks/kew.svg",
    isFree: false,
    isPmrFriendly: true,
    tags: ["botanical", "historic", "photo"],
    translations: {
      en: { name: "Kew Gardens", tagline: "Botanic garden · London, UK" },
      fr: { name: "Kew Gardens", tagline: "Jardin botanique · Londres, Royaume-Uni" },
      nl: { name: "Kew Gardens", tagline: "Botanische tuin · Londen, VK" },
    },
  }),
  showcasePark(4, {
    slug: "jardin-des-plantes",
    type: "BOTANICAL_GARDEN",
    countryCode: "FR",
    city: "Paris",
    timezone: "Europe/Paris",
    defaultLocale: "fr",
    availableLocales: ["fr", "en"],
    location: { lat: 48.8440, lng: 2.3596 },
    coverImageUrl: "/demo/parks/jardin-des-plantes.svg",
    isFree: true,
    isPmrFriendly: true,
    tags: ["botanical", "historic", "family", "free"],
    translations: {
      fr: { name: "Jardin des Plantes", tagline: "Jardin botanique · Paris, France" },
      en: { name: "Jardin des Plantes", tagline: "Botanic garden · Paris, France" },
      nl: { name: "Jardin des Plantes", tagline: "Botanische tuin · Parijs, Frankrijk" },
    },
  }),
  showcasePark(5, {
    slug: "hyde-park",
    type: "HISTORIC_PARK",
    countryCode: "GB",
    city: "London",
    timezone: "Europe/London",
    defaultLocale: "en",
    location: { lat: 51.5073, lng: -0.1657 },
    coverImageUrl: "/demo/parks/hyde-park.svg",
    isFree: true,
    isPmrFriendly: true,
    tags: ["urban", "historic", "free"],
    translations: {
      en: { name: "Hyde Park", tagline: "Royal park · London, UK" },
      fr: { name: "Hyde Park", tagline: "Parc royal · Londres, Royaume-Uni" },
      nl: { name: "Hyde Park", tagline: "Koninklijk park · Londen, VK" },
    },
  }),
];

// ---------------------------------------------------------------------------
// Catégories de spots (globales)
// ---------------------------------------------------------------------------

const cat = (n: number, key: string, icon: string, color: string, fr: string, nl: string, en: string, es: string, de: string): SpotCategoryRecord => ({
  id: demoId("category", n),
  parkId: null,
  key,
  icon,
  color,
  sortOrder: n,
  translations: { fr: { name: fr }, nl: { name: nl }, en: { name: en }, es: { name: es }, de: { name: de } },
});

export const spotCategories: SpotCategoryRecord[] = [
  cat(1, "remarkable-trees", "tree-deciduous", "#19E6A2", "Arbres remarquables", "Merkwaardige bomen", "Remarkable trees", "Árboles notables", "Bemerkenswerte Bäume"),
  cat(2, "flowers", "flower-2", "#F28DB2", "Fleurs", "Bloemen", "Flowers", "Flores", "Blumen"),
  cat(3, "gardens", "sprout", "#8AF4C9", "Jardins thématiques", "Thematuinen", "Themed gardens", "Jardines temáticos", "Themengärten"),
  cat(4, "history", "landmark", "#F4C95D", "Histoire", "Geschiedenis", "History", "Historia", "Geschichte"),
  cat(5, "viewpoints", "mountain", "#9DB8FF", "Points de vue", "Uitkijkpunten", "Viewpoints", "Miradores", "Aussichtspunkte"),
  cat(6, "water", "waves", "#5CC8FF", "Eau", "Water", "Water", "Agua", "Wasser"),
  cat(7, "glasshouses", "warehouse", "#C9A7FF", "Serres", "Serres", "Glasshouses", "Invernaderos", "Gewächshäuser"),
];

// ---------------------------------------------------------------------------
// Badges (globaux)
// ---------------------------------------------------------------------------

const badge = (
  n: number,
  key: string,
  icon: string,
  criteria: BadgeRecord["criteria"],
  threshold: number,
  t: BadgeRecord["translations"],
): BadgeRecord => ({ id: demoId("badge", n), parkId: null, key, icon, criteria, threshold, sortOrder: n, translations: t });

export const badges: BadgeRecord[] = [
  badge(1, "premier-pas", "footprints", "SPOTS_DISCOVERED", 1, {
    fr: { name: "Premier pas", description: "Découvrir son premier spot." },
    nl: { name: "Eerste stap", description: "Je eerste spot ontdekken." },
    en: { name: "First step", description: "Discover your first spot." },
    es: { name: "Primer paso" },
    de: { name: "Erster Schritt" },
  }),
  badge(2, "explorateur", "compass", "SPOTS_DISCOVERED", 10, {
    fr: { name: "Explorateur", description: "Découvrir 10 spots." },
    nl: { name: "Ontdekkingsreiziger", description: "10 spots ontdekken." },
    en: { name: "Explorer", description: "Discover 10 spots." },
    es: { name: "Explorador" },
    de: { name: "Entdecker" },
  }),
  badge(3, "detective", "search", "QUIZZES_PASSED", 5, {
    fr: { name: "Détective", description: "Réussir 5 quiz." },
    nl: { name: "Detective", description: "5 quizzen juist beantwoorden." },
    en: { name: "Detective", description: "Pass 5 quizzes." },
    es: { name: "Detective" },
    de: { name: "Detektiv" },
  }),
  badge(4, "photographe", "camera", "PHOTOS_APPROVED", 10, {
    fr: { name: "Photographe", description: "10 photos validées." },
    nl: { name: "Fotograaf", description: "10 goedgekeurde foto's." },
    en: { name: "Photographer", description: "10 approved photos." },
    es: { name: "Fotógrafo" },
    de: { name: "Fotograf" },
  }),
  badge(5, "grand-marcheur", "route", "DISTANCE_M", 10000, {
    fr: { name: "Grand marcheur", description: "Parcourir 10 km." },
    nl: { name: "Grote wandelaar", description: "10 km wandelen." },
    en: { name: "Great walker", description: "Walk 10 km." },
    es: { name: "Gran caminante" },
    de: { name: "Großer Wanderer" },
  }),
  badge(6, "maitre-botaniste", "leaf", "SPOTS_DISCOVERED", 50, {
    fr: { name: "Maître botaniste", description: "50 découvertes." },
    nl: { name: "Meester-botanicus", description: "50 ontdekkingen." },
    en: { name: "Master botanist", description: "50 discoveries." },
    es: { name: "Maestro botánico" },
    de: { name: "Meisterbotaniker" },
  }),
  badge(7, "boucle-bouclee", "flag", "TRAILS_COMPLETED", 1, {
    fr: { name: "Boucle bouclée", description: "Terminer un premier parcours." },
    nl: { name: "Rondje rond", description: "Een eerste route afwerken." },
    en: { name: "Loop closed", description: "Complete your first trail." },
  }),
];

// ---------------------------------------------------------------------------
// Articles / conseils
// ---------------------------------------------------------------------------

export const articleCategories: ArticleCategoryRecord[] = [
  { id: demoId("articleCategory", 1), key: "trees", sortOrder: 1 },
  { id: demoId("articleCategory", 2), key: "botany", sortOrder: 2 },
  { id: demoId("articleCategory", 3), key: "family", sortOrder: 3 },
];

export const articles: ArticleRecord[] = [
  {
    id: demoId("article", 1),
    parkId: null,
    categoryKey: "trees",
    slug: "reconnaitre-un-chene",
    status: "PUBLISHED",
    isDemoData: true,
    coverImageUrl: "/demo/spots/oak.svg",
    readingMinutes: 5,
    publishedAt: "2026-09-01T09:00:00Z",
    translations: {
      fr: {
        title: "Comment reconnaître un chêne ?",
        excerpt: "Feuilles lobées, glands, écorce crevassée : trois indices infaillibles.",
        bodyMd:
          "## 1. Les feuilles\nLes feuilles du chêne ont des **lobes arrondis**, comme des vagues sur les bords.\n\n## 2. Les glands\nEn automne, cherchez les **glands** au sol. Chez le chêne pédonculé, ils pendent au bout d'une longue tige.\n\n## 3. L'écorce\nSur un vieux chêne, l'écorce est **épaisse et profondément crevassée**.\n\n> Astuce famille : ramassez une feuille tombée et comparez-la aux arbres voisins !",
      },
      nl: {
        title: "Hoe herken je een eik?",
        excerpt: "Gelobde bladeren, eikels, gegroefde schors: drie onfeilbare aanwijzingen.",
        bodyMd:
          "## 1. De bladeren\nEikenbladeren hebben **afgeronde lobben**, als golfjes langs de rand.\n\n## 2. De eikels\nZoek in de herfst naar **eikels** op de grond.\n\n## 3. De schors\nBij een oude eik is de schors **dik en diep gegroefd**.",
      },
      en: {
        title: "How to recognise an oak?",
        excerpt: "Lobed leaves, acorns, furrowed bark: three sure-fire clues.",
        bodyMd:
          "## 1. The leaves\nOak leaves have **rounded lobes**, like waves along the edge.\n\n## 2. The acorns\nIn autumn, look for **acorns** on the ground.\n\n## 3. The bark\nOn an old oak, the bark is **thick and deeply furrowed**.",
      },
    },
  },
  {
    id: demoId("article", 2),
    parkId: null,
    categoryKey: "botany",
    slug: "plantes-exotiques-des-serres",
    status: "PUBLISHED",
    isDemoData: true,
    coverImageUrl: "/demo/spots/glasshouse.svg",
    readingMinutes: 7,
    publishedAt: "2026-09-08T09:00:00Z",
    translations: {
      fr: {
        title: "Les plantes exotiques des serres",
        excerpt: "Cactus, orchidées, plantes carnivores : un tour du monde sous verre.",
        bodyMd:
          "Les serres recréent des **climats du monde entier** : désert, forêt tropicale, montagne.\n\n- **Cactus** : ils stockent l'eau dans leurs tiges.\n- **Orchidées** : certaines imitent des insectes pour attirer leurs pollinisateurs.\n- **Plantes carnivores** : elles complètent leur alimentation avec des insectes.",
      },
      nl: {
        title: "De exotische planten van de serres",
        excerpt: "Cactussen, orchideeën, vleesetende planten: een wereldreis onder glas.",
        bodyMd: "Serres bootsen **klimaten van over de hele wereld** na: woestijn, regenwoud, gebergte.",
      },
      en: {
        title: "The exotic plants of the glasshouses",
        excerpt: "Cacti, orchids, carnivorous plants: a world tour under glass.",
        bodyMd: "Glasshouses recreate **climates from all over the world**: desert, rainforest, mountains.",
      },
    },
  },
  {
    id: demoId("article", 3),
    parkId: null,
    categoryKey: "family",
    slug: "5-jeux-en-famille-dans-un-parc",
    status: "PUBLISHED",
    isDemoData: true,
    coverImageUrl: "/demo/trails/remarkable-trees.svg",
    readingMinutes: 4,
    publishedAt: "2026-09-15T09:00:00Z",
    translations: {
      fr: {
        title: "5 jeux à faire en famille dans un parc",
        excerpt: "Chasse aux couleurs, bingo nature, détective des feuilles…",
        bodyMd:
          "1. **Chasse aux couleurs** : trouvez quelque chose de rouge, jaune, violet…\n2. **Bingo nature** : un écureuil, un champignon, une plume.\n3. **Détective des feuilles** : combien de formes différentes ?\n4. **Le silence des oiseaux** : une minute d'écoute, combien de chants ?\n5. **Mesure un géant** : combien d'enfants pour faire le tour d'un tronc ?",
      },
      nl: {
        title: "5 spelletjes voor het hele gezin in een park",
        excerpt: "Kleurenjacht, natuurbingo, bladerdetective…",
        bodyMd: "1. **Kleurenjacht**\n2. **Natuurbingo**\n3. **Bladerdetective**\n4. **Vogelstilte**\n5. **Meet een reus**",
      },
      en: {
        title: "5 family games to play in a park",
        excerpt: "Colour hunt, nature bingo, leaf detective…",
        bodyMd: "1. **Colour hunt**\n2. **Nature bingo**\n3. **Leaf detective**\n4. **Bird silence**\n5. **Measure a giant**",
      },
    },
  },
];
