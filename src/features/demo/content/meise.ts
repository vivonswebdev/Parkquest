/**
 * PARC PILOTE — Plantentuin Meise (Meise, Belgique).
 *
 * ⚠️ DONNÉES DE DÉMONSTRATION. Les coordonnées, dates, mesures, horaires,
 * tarifs et textes ci-dessous sont des exemples plausibles, NON validés par
 * le parc. Ils doivent être vérifiés et autorisés par Plantentuin Meise avant
 * toute publication officielle (voir docs/DEMO_DATA_VALIDATION.md).
 */
import type {
  ChallengeRecord,
  FacilityRecord,
  ParkRecord,
  QuizRecord,
  SpotRecord,
  TrailRecord,
} from "@/lib/domain/types";
import { demoId } from "./ids";

export const MEISE_ID = demoId("park", 1);

export const meisePark: ParkRecord = {
  id: MEISE_ID,
  slug: "plantentuin-meise",
  type: "BOTANICAL_GARDEN",
  status: "PUBLISHED",
  isDemoData: true,
  countryCode: "BE",
  city: "Meise",
  timezone: "Europe/Brussels",
  defaultLocale: "nl",
  availableLocales: ["fr", "nl", "en", "es", "de"],
  location: { lat: 50.9276, lng: 4.3268 },
  bounds: [
    { lat: 50.9238, lng: 4.3176 },
    { lat: 50.9318, lng: 4.3352 },
  ],
  defaultZoom: 15.6,
  brandColor: "#19E6A2",
  coverImageUrl: "/demo/parks/meise.svg",
  isFree: false,
  isPmrFriendly: true,
  tags: ["botanical", "family", "photo", "pmr", "historic"],
  translations: {
    fr: {
      name: "Plantentuin Meise",
      tagline: "Jardin botanique · Meise, Belgique",
      description:
        "Un vaste jardin botanique autour d'un château, avec des arbres remarquables, des serres et des jardins thématiques. Parfait pour une visite en famille.",
      practicalNotes:
        "Prévoyez de bonnes chaussures : certains chemins sont en gravier. Les chiens ne sont pas admis (donnée de démonstration).",
      accessibilityNotes:
        "Les allées principales sont accessibles en fauteuil. Certains sentiers en forêt sont en terre battue.",
      transportNotes: "Bus depuis Bruxelles-Nord, arrêt « Plantentuin » (donnée de démonstration).",
      rules:
        "Restez sur les chemins, ne cueillez pas les plantes, emportez vos déchets. Pique-nique autorisé dans les zones prévues.",
    },
    nl: {
      name: "Plantentuin Meise",
      tagline: "Botanische tuin · Meise, België",
      description:
        "Een uitgestrekte botanische tuin rond een kasteel, met merkwaardige bomen, serres en thematuinen. Ideaal voor een gezinsbezoek.",
      practicalNotes:
        "Draag goede schoenen: sommige paden zijn in grind. Honden zijn niet toegelaten (demogegevens).",
      accessibilityNotes:
        "De hoofdpaden zijn toegankelijk met een rolstoel. Sommige bospaden zijn onverhard.",
      transportNotes: "Bus vanaf Brussel-Noord, halte « Plantentuin » (demogegevens).",
      rules:
        "Blijf op de paden, pluk geen planten, neem je afval mee. Picknicken mag in de voorziene zones.",
    },
    en: {
      name: "Meise Botanic Garden",
      tagline: "Botanic garden · Meise, Belgium",
      description:
        "A vast botanic garden around a castle, with remarkable trees, glasshouses and themed gardens. Perfect for a family visit.",
      practicalNotes:
        "Wear good shoes: some paths are gravel. Dogs are not allowed (demo data).",
      accessibilityNotes:
        "Main paths are wheelchair accessible. Some woodland trails are unpaved.",
      transportNotes: "Bus from Brussels-North, stop “Plantentuin” (demo data).",
      rules:
        "Stay on the paths, do not pick plants, take your litter home. Picnics allowed in designated areas.",
    },
    es: {
      name: "Jardín Botánico de Meise",
      tagline: "Jardín botánico · Meise, Bélgica",
      description:
        "Un gran jardín botánico alrededor de un castillo, con árboles notables, invernaderos y jardines temáticos.",
    },
    de: {
      name: "Botanischer Garten Meise",
      tagline: "Botanischer Garten · Meise, Belgien",
      description:
        "Ein weitläufiger botanischer Garten rund um ein Schloss, mit bemerkenswerten Bäumen, Gewächshäusern und Themengärten.",
    },
  },
  practicalInfo: {
    addressLine: "Nieuwelaan 38",
    postalCode: "1860 Meise",
    websiteUrl: "https://www.plantentuinmeise.be",
    ticketUrl: "https://www.plantentuinmeise.be",
    openingHours: [
      { days: [1, 2, 3, 4, 5, 6, 7], open: "09:30", close: "18:00", season: "summer" },
      { days: [1, 2, 3, 4, 5, 6, 7], open: "09:30", close: "17:00", season: "winter" },
    ],
    prices: [
      { labelKey: "adult", amount: 8, currency: "EUR" },
      { labelKey: "senior", amount: 7, currency: "EUR" },
      { labelKey: "child", amount: 2, currency: "EUR" },
      { labelKey: "free", amount: 0, currency: "EUR" },
    ],
  },
};

// ---------------------------------------------------------------------------
// Spots
// ---------------------------------------------------------------------------

const S = (n: number) => demoId("spot", n);

export const meiseSpots: SpotRecord[] = [
  {
    id: S(1),
    parkId: MEISE_ID,
    slug: "sequoia-geant",
    kind: "TREE",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92845, lng: 4.32505 },
    discoveryRadiusM: 35,
    scientificName: "Sequoiadendron giganteum",
    facts: { originKey: "north_america", plantedYear: 1923, heightM: 38, girthM: 7.2 },
    coverImageUrl: "/demo/spots/sequoia.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 1,
    categoryKeys: ["remarkable-trees"],
    translations: {
      fr: {
        name: "Séquoia géant",
        label: "Arbre remarquable",
        summary: "Un géant venu des montagnes de Californie.",
        about:
          "Le séquoia géant est l'un des plus grands êtres vivants de la planète. Son écorce épaisse et spongieuse le protège des incendies. Celui-ci aurait été planté il y a une centaine d'années.",
        funFact: "Les séquoias géants peuvent vivre plus de 3 000 ans !",
        directions: "Depuis l'entrée, suivez l'allée principale puis prenez à gauche après la grande pelouse.",
        origin: "Californie, États-Unis",
      },
      nl: {
        name: "Mammoetboom",
        label: "Merkwaardige boom",
        summary: "Een reus uit de bergen van Californië.",
        about:
          "De mammoetboom is een van de grootste levende wezens op aarde. Zijn dikke, sponsachtige schors beschermt hem tegen bosbranden. Deze boom zou zo'n honderd jaar geleden geplant zijn.",
        funFact: "Mammoetbomen kunnen meer dan 3 000 jaar oud worden!",
        directions: "Volg vanaf de ingang de hoofddreef en sla links af na het grote grasveld.",
        origin: "Californië, Verenigde Staten",
      },
      en: {
        name: "Giant sequoia",
        label: "Remarkable tree",
        summary: "A giant from the mountains of California.",
        about:
          "The giant sequoia is one of the largest living things on Earth. Its thick, spongy bark protects it from wildfires. This one is said to have been planted about a hundred years ago.",
        funFact: "Giant sequoias can live for more than 3,000 years!",
        directions: "From the entrance, follow the main avenue and turn left after the large lawn.",
        origin: "California, USA",
      },
      es: { name: "Secuoya gigante", label: "Árbol notable", origin: "California, EE. UU." },
      de: { name: "Riesenmammutbaum", label: "Bemerkenswerter Baum", origin: "Kalifornien, USA" },
    },
  },
  {
    id: S(2),
    parkId: MEISE_ID,
    slug: "chene-remarquable",
    kind: "TREE",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92705, lng: 4.32365 },
    discoveryRadiusM: 35,
    scientificName: "Quercus robur",
    facts: { originKey: "europe", plantedYear: 1850, heightM: 27, girthM: 5.1 },
    coverImageUrl: "/demo/spots/oak.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 2,
    categoryKeys: ["remarkable-trees"],
    translations: {
      fr: {
        name: "Chêne remarquable",
        label: "Arbre remarquable",
        summary: "Un chêne pédonculé plus que centenaire.",
        about:
          "Le chêne pédonculé abrite des centaines d'espèces d'insectes, d'oiseaux et de champignons. Ses glands, portés par un long pédoncule, lui donnent son nom.",
        funFact: "Un seul grand chêne peut accueillir plus de 2 000 espèces vivantes.",
        directions: "Continuez sur le chemin forestier jusqu'à la clairière.",
        origin: "Europe",
      },
      nl: {
        name: "Merkwaardige eik",
        label: "Merkwaardige boom",
        summary: "Een zomereik van meer dan honderd jaar oud.",
        about:
          "De zomereik biedt onderdak aan honderden soorten insecten, vogels en paddenstoelen. Zijn eikels hangen aan een lange steel.",
        funFact: "Eén grote eik kan meer dan 2 000 levende soorten herbergen.",
        directions: "Volg het bospad tot aan de open plek.",
        origin: "Europa",
      },
      en: {
        name: "Remarkable oak",
        label: "Remarkable tree",
        summary: "A pedunculate oak over a hundred years old.",
        about:
          "The pedunculate oak shelters hundreds of species of insects, birds and fungi. Its acorns hang from a long stalk, which gives the tree its name.",
        funFact: "A single large oak can host more than 2,000 living species.",
        directions: "Follow the woodland path to the clearing.",
        origin: "Europe",
      },
      es: { name: "Roble notable", label: "Árbol notable", origin: "Europa" },
      de: { name: "Bemerkenswerte Eiche", label: "Bemerkenswerter Baum", origin: "Europa" },
    },
  },
  {
    id: S(3),
    parkId: MEISE_ID,
    slug: "magnolia",
    kind: "FLOWER",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92615, lng: 4.32615 },
    discoveryRadiusM: 30,
    scientificName: "Magnolia × soulangeana",
    facts: { originKey: "asia", bloomMonths: [3, 4] },
    coverImageUrl: "/demo/spots/magnolia.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 3,
    categoryKeys: ["flowers"],
    translations: {
      fr: {
        name: "Magnolia",
        label: "Floraison de printemps",
        summary: "Des fleurs géantes avant même les feuilles.",
        about:
          "Les magnolias sont parmi les plus anciennes plantes à fleurs. Ils existaient déjà avant l'apparition des abeilles : ce sont des coléoptères qui les pollinisaient !",
        funFact: "Les magnolias existent depuis environ 95 millions d'années.",
        directions: "Longez la pelouse vers le sud, le magnolia est au bord de l'allée.",
        origin: "Asie (hybride horticole)",
      },
      nl: {
        name: "Magnolia",
        label: "Voorjaarsbloei",
        summary: "Reusachtige bloemen nog vóór de bladeren.",
        about:
          "Magnolia's behoren tot de oudste bloeiende planten. Ze bestonden al vóór de bijen: kevers bestoven ze!",
        funFact: "Magnolia's bestaan al zo'n 95 miljoen jaar.",
        directions: "Volg het grasveld naar het zuiden, de magnolia staat langs het pad.",
        origin: "Azië (tuinhybride)",
      },
      en: {
        name: "Magnolia",
        label: "Spring bloom",
        summary: "Huge flowers even before the leaves appear.",
        about:
          "Magnolias are among the oldest flowering plants. They existed before bees did — beetles pollinated them!",
        funFact: "Magnolias have existed for about 95 million years.",
        directions: "Walk south along the lawn; the magnolia stands by the path.",
        origin: "Asia (garden hybrid)",
      },
      es: { name: "Magnolia", label: "Floración de primavera" },
      de: { name: "Magnolie", label: "Frühlingsblüte" },
    },
  },
  {
    id: S(4),
    parkId: MEISE_ID,
    slug: "jardin-des-roses",
    kind: "GARDEN",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92585, lng: 4.32905 },
    discoveryRadiusM: 45,
    facts: { bloomMonths: [6, 7, 8, 9] },
    coverImageUrl: "/demo/spots/roses.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 4,
    categoryKeys: ["flowers", "gardens"],
    translations: {
      fr: {
        name: "Jardin des roses",
        label: "Jardin thématique",
        summary: "Des dizaines de variétés de roses parfumées.",
        about:
          "Ce jardin présente des roses anciennes et modernes. Approchez-vous : chaque variété a un parfum différent, du citron à l'épice.",
        funFact: "Il existe plus de 30 000 variétés de roses cultivées.",
        directions: "Traversez le petit pont puis suivez les arceaux fleuris.",
      },
      nl: {
        name: "Rozentuin",
        label: "Thematuin",
        summary: "Tientallen geurende rozenrassen.",
        about:
          "Deze tuin toont oude en moderne rozen. Kom dichterbij: elk ras heeft een andere geur, van citroen tot kruiden.",
        funFact: "Er bestaan meer dan 30 000 gekweekte rozenrassen.",
        directions: "Steek het bruggetje over en volg de bloemenbogen.",
      },
      en: {
        name: "Rose garden",
        label: "Themed garden",
        summary: "Dozens of fragrant rose varieties.",
        about:
          "This garden showcases old and modern roses. Come closer: every variety smells different, from lemon to spice.",
        funFact: "There are more than 30,000 cultivated rose varieties.",
        directions: "Cross the small bridge and follow the flowering arches.",
      },
      es: { name: "Jardín de rosas", label: "Jardín temático" },
      de: { name: "Rosengarten", label: "Themengarten" },
    },
  },
  {
    id: S(5),
    parkId: MEISE_ID,
    slug: "point-de-vue",
    kind: "VIEWPOINT",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92735, lng: 4.33055 },
    discoveryRadiusM: 40,
    facts: {},
    coverImageUrl: "/demo/spots/viewpoint.svg",
    isPmrAccessible: false,
    pointsValue: 10,
    sortOrder: 5,
    categoryKeys: ["viewpoints"],
    translations: {
      fr: {
        name: "Point de vue",
        label: "Panorama",
        summary: "Une vue dégagée sur l'étang et le château.",
        about:
          "Depuis cette petite butte, on embrasse du regard l'étang, les grands arbres et la silhouette du château. Le meilleur moment : fin d'après-midi.",
        funFact: "Les photographes appellent la lumière de fin de journée « l'heure dorée ».",
        directions: "Montez le sentier en pente douce à droite de la roseraie.",
      },
      nl: {
        name: "Uitkijkpunt",
        label: "Panorama",
        summary: "Een weids zicht op de vijver en het kasteel.",
        about:
          "Vanaf deze kleine heuvel overzie je de vijver, de grote bomen en het silhouet van het kasteel. Beste moment: laat in de namiddag.",
        funFact: "Fotografen noemen het licht aan het eind van de dag het « gouden uur ».",
        directions: "Neem het zacht hellende pad rechts van de rozentuin.",
      },
      en: {
        name: "Viewpoint",
        label: "Panorama",
        summary: "An open view over the pond and the castle.",
        about:
          "From this small hill you can take in the pond, the tall trees and the castle's silhouette. Best time: late afternoon.",
        funFact: "Photographers call the light at the end of the day the “golden hour”.",
        directions: "Climb the gently sloping trail to the right of the rose garden.",
      },
      es: { name: "Mirador", label: "Panorama" },
      de: { name: "Aussichtspunkt", label: "Panorama" },
    },
  },
  {
    id: S(6),
    parkId: MEISE_ID,
    slug: "pavillon-historique",
    kind: "HISTORIC",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92875, lng: 4.32885 },
    discoveryRadiusM: 40,
    facts: { builtYear: 1890 },
    coverImageUrl: "/demo/spots/pavilion.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 6,
    categoryKeys: ["history"],
    translations: {
      fr: {
        name: "Pavillon historique",
        label: "Lieu historique — à confirmer",
        summary: "Un lieu d'exemple pour illustrer les fiches « histoire ».",
        about:
          "Ce spot est un exemple fictif. Il sera remplacé par un bâtiment historique réel du domaine, avec un texte validé par l'équipe du jardin.",
        funFact: "Les fiches histoire peuvent afficher dates, architectes et anecdotes validées.",
        directions: "Revenez vers l'allée principale, le pavillon est sur la droite.",
      },
      nl: {
        name: "Historisch paviljoen",
        label: "Historische plek — te bevestigen",
        summary: "Een voorbeeldplek om de « geschiedenis »-fiches te tonen.",
        about:
          "Deze plek is fictief. Ze wordt vervangen door een echt historisch gebouw van het domein, met een tekst gevalideerd door het tuinteam.",
        funFact: "Geschiedenisfiches kunnen gevalideerde data, architecten en anekdotes tonen.",
        directions: "Ga terug naar de hoofddreef, het paviljoen ligt rechts.",
      },
      en: {
        name: "Historic pavilion",
        label: "Historic place — to be confirmed",
        summary: "A sample place to illustrate “history” cards.",
        about:
          "This spot is fictional. It will be replaced by a real historic building on the estate, with text validated by the garden team.",
        funFact: "History cards can show validated dates, architects and anecdotes.",
        directions: "Head back to the main avenue; the pavilion is on the right.",
      },
      es: { name: "Pabellón histórico", label: "Lugar histórico — por confirmar" },
      de: { name: "Historischer Pavillon", label: "Historischer Ort — zu bestätigen" },
    },
  },
  {
    id: S(7),
    parkId: MEISE_ID,
    slug: "ginkgo",
    kind: "TREE",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92945, lng: 4.32415 },
    discoveryRadiusM: 30,
    scientificName: "Ginkgo biloba",
    facts: { originKey: "asia", heightM: 21 },
    coverImageUrl: "/demo/spots/ginkgo.svg",
    pointsValue: 10,
    sortOrder: 7,
    categoryKeys: ["remarkable-trees"],
    translations: {
      fr: {
        name: "Ginkgo",
        label: "Fossile vivant",
        summary: "Un arbre qui a connu les dinosaures.",
        about: "Le ginkgo existait déjà il y a plus de 200 millions d'années. Ses feuilles en éventail deviennent jaune or en automne.",
        funFact: "Des ginkgos ont survécu à Hiroshima en 1945 et poussent encore.",
        origin: "Chine",
      },
      nl: {
        name: "Ginkgo",
        label: "Levend fossiel",
        summary: "Een boom die de dinosaurussen heeft gekend.",
        about: "De ginkgo bestond al meer dan 200 miljoen jaar geleden. Zijn waaiervormige bladeren kleuren goudgeel in de herfst.",
        funFact: "Ginkgo's overleefden Hiroshima in 1945 en groeien er nog steeds.",
        origin: "China",
      },
      en: {
        name: "Ginkgo",
        label: "Living fossil",
        summary: "A tree that knew the dinosaurs.",
        about: "The ginkgo already existed more than 200 million years ago. Its fan-shaped leaves turn golden in autumn.",
        funFact: "Ginkgos survived Hiroshima in 1945 and still grow there.",
        origin: "China",
      },
    },
  },
  {
    id: S(8),
    parkId: MEISE_ID,
    slug: "cedre-du-liban",
    kind: "TREE",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92795, lng: 4.32195 },
    discoveryRadiusM: 35,
    scientificName: "Cedrus libani",
    facts: { originKey: "middle_east", heightM: 25 },
    coverImageUrl: "/demo/spots/cedar.svg",
    pointsValue: 10,
    sortOrder: 8,
    categoryKeys: ["remarkable-trees"],
    translations: {
      fr: { name: "Cèdre du Liban", label: "Conifère majestueux", summary: "Des branches étagées comme des plateaux.", origin: "Moyen-Orient" },
      nl: { name: "Libanonceder", label: "Majestueuze conifeer", summary: "Takken in etages, als dienbladen.", origin: "Midden-Oosten" },
      en: { name: "Cedar of Lebanon", label: "Majestic conifer", summary: "Tiered branches like trays.", origin: "Middle East" },
    },
  },
  {
    id: S(9),
    parkId: MEISE_ID,
    slug: "hetre-pourpre",
    kind: "TREE",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92985, lng: 4.32745 },
    discoveryRadiusM: 35,
    scientificName: "Fagus sylvatica f. purpurea",
    facts: { originKey: "europe", heightM: 24 },
    coverImageUrl: "/demo/spots/beech.svg",
    pointsValue: 10,
    sortOrder: 9,
    categoryKeys: ["remarkable-trees"],
    translations: {
      fr: { name: "Hêtre pourpre", label: "Arbre remarquable", summary: "Un feuillage couleur prune.", origin: "Europe" },
      nl: { name: "Bruine beuk", label: "Merkwaardige boom", summary: "Pruimkleurig gebladerte.", origin: "Europa" },
      en: { name: "Copper beech", label: "Remarkable tree", summary: "Plum-coloured foliage.", origin: "Europe" },
    },
  },
  {
    id: S(10),
    parkId: MEISE_ID,
    slug: "etang",
    kind: "WATER",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92665, lng: 4.32825 },
    discoveryRadiusM: 60,
    facts: {},
    coverImageUrl: "/demo/spots/pond.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 10,
    categoryKeys: ["water"],
    translations: {
      fr: { name: "Étang", label: "Milieu aquatique", summary: "Canards, nénuphars et libellules." },
      nl: { name: "Vijver", label: "Waterrijk gebied", summary: "Eenden, waterlelies en libellen." },
      en: { name: "Pond", label: "Wetland", summary: "Ducks, water lilies and dragonflies." },
    },
  },
  {
    id: S(11),
    parkId: MEISE_ID,
    slug: "grandes-serres",
    kind: "BUILDING",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92905, lng: 4.32575 },
    discoveryRadiusM: 50,
    facts: {},
    coverImageUrl: "/demo/spots/glasshouse.svg",
    isPmrAccessible: true,
    pointsValue: 10,
    sortOrder: 11,
    categoryKeys: ["glasshouses"],
    translations: {
      fr: { name: "Grandes serres", label: "Plantes exotiques", summary: "Un voyage sous les tropiques, à l'abri." },
      nl: { name: "Grote serres", label: "Exotische planten", summary: "Een reis naar de tropen, beschut." },
      en: { name: "Great glasshouses", label: "Exotic plants", summary: "A trip to the tropics, under glass." },
    },
  },
  {
    id: S(12),
    parkId: MEISE_ID,
    slug: "bambouseraie",
    kind: "PLANT",
    status: "PUBLISHED",
    isDemoData: true,
    location: { lat: 50.92535, lng: 4.32475 },
    discoveryRadiusM: 35,
    scientificName: "Phyllostachys sp.",
    facts: { originKey: "asia" },
    coverImageUrl: "/demo/spots/bamboo.svg",
    pointsValue: 10,
    sortOrder: 12,
    categoryKeys: ["gardens"],
    translations: {
      fr: { name: "Bambouseraie", label: "Plantes étonnantes", summary: "Des tiges qui poussent à vue d'œil.", origin: "Asie" },
      nl: { name: "Bamboebos", label: "Verrassende planten", summary: "Stengels die zienderogen groeien.", origin: "Azië" },
      en: { name: "Bamboo grove", label: "Surprising plants", summary: "Stems that grow before your eyes.", origin: "Asia" },
    },
  },
];

// ---------------------------------------------------------------------------
// Parcours pilote : Découverte des arbres remarquables (6 spots)
// ---------------------------------------------------------------------------

const ENTRANCE = { lat: 50.9296, lng: 4.3271 };
const G = (n: number) => demoId("segment", n);
const byId = (id: string) => meiseSpots.find((s) => s.id === id)!;

/** Petite courbe entre deux points pour dessiner un chemin plausible. */
function curve(a: { lat: number; lng: number }, b: { lat: number; lng: number }, bend: number): [number, number][] {
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  const ctrl = { lat: mid.lat - dLng * bend * 0.6, lng: mid.lng + dLat * bend * 1.6 };
  const pts: [number, number][] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    const lat = (1 - t) ** 2 * a.lat + 2 * (1 - t) * t * ctrl.lat + t ** 2 * b.lat;
    const lng = (1 - t) ** 2 * a.lng + 2 * (1 - t) * t * ctrl.lng + t ** 2 * b.lng;
    pts.push([Number(lng.toFixed(6)), Number(lat.toFixed(6))]);
  }
  return pts;
}

const trailSpotIds = [S(1), S(2), S(3), S(4), S(5), S(6)];

const instructions: { fr: string; nl: string; en: string }[] = [
  {
    fr: "Depuis l'entrée, suivez l'allée principale puis prenez à gauche après la grande pelouse.",
    nl: "Volg vanaf de ingang de hoofddreef en sla links af na het grote grasveld.",
    en: "From the entrance, follow the main avenue and turn left after the large lawn.",
  },
  {
    fr: "Continuez sur le chemin forestier jusqu'à la clairière.",
    nl: "Volg het bospad tot aan de open plek.",
    en: "Follow the woodland path to the clearing.",
  },
  {
    fr: "Continuez tout droit, puis tournez à droite après la fontaine.",
    nl: "Ga rechtdoor en sla rechtsaf na de fontein.",
    en: "Go straight on, then turn right after the fountain.",
  },
  {
    fr: "Traversez le petit pont puis suivez les arceaux fleuris.",
    nl: "Steek het bruggetje over en volg de bloemenbogen.",
    en: "Cross the small bridge and follow the flowering arches.",
  },
  {
    fr: "Montez le sentier en pente douce à droite de la roseraie.",
    nl: "Neem het zacht hellende pad rechts van de rozentuin.",
    en: "Climb the gently sloping trail to the right of the rose garden.",
  },
  {
    fr: "Redescendez vers l'allée principale, le pavillon est sur la droite.",
    nl: "Daal af naar de hoofddreef, het paviljoen ligt rechts.",
    en: "Walk back down to the main avenue; the pavilion is on the right.",
  },
];

export const meiseTrails: TrailRecord[] = [
  {
    id: demoId("trail", 1),
    parkId: MEISE_ID,
    slug: "arbres-remarquables",
    status: "PUBLISHED",
    isDemoData: true,
    difficulty: "EASY",
    durationMin: 45,
    distanceM: 1800,
    audiences: ["FAMILY", "KIDS", "CURIOUS"],
    themes: ["ESSENTIALS", "TREES", "FLOWERS", "PHOTO"],
    isPmrAccessible: false,
    pmrPartial: true,
    coverImageUrl: "/demo/trails/remarkable-trees.svg",
    completionPoints: 20,
    sortOrder: 1,
    start: ENTRANCE,
    spotIds: trailSpotIds,
    segments: trailSpotIds.map((toId, i) => {
      const from = i === 0 ? ENTRANCE : byId(trailSpotIds[i - 1]).location;
      const to = byId(toId).location;
      return {
        id: G(i + 1),
        fromSpotId: i === 0 ? null : trailSpotIds[i - 1],
        toSpotId: toId,
        position: i + 1,
        path: curve(from, to, i % 2 === 0 ? 0.25 : -0.2),
        translations: {
          fr: { instruction: instructions[i].fr },
          nl: { instruction: instructions[i].nl },
          en: { instruction: instructions[i].en },
        },
      };
    }),
    translations: {
      fr: {
        name: "Découverte des arbres remarquables",
        summary: "6 spots, des géants venus du monde entier.",
        description:
          "Une boucle facile pour découvrir les arbres les plus impressionnants du jardin, une floraison spectaculaire et un joli point de vue. Idéal en famille.",
        accessibilityNotes: "Partiellement accessible : le point de vue est sur une butte en terre (donnée de démonstration).",
      },
      nl: {
        name: "Ontdekking van merkwaardige bomen",
        summary: "6 spots, reuzen uit de hele wereld.",
        description:
          "Een makkelijke lus langs de indrukwekkendste bomen van de tuin, een spectaculaire bloei en een mooi uitzicht. Ideaal voor gezinnen.",
        accessibilityNotes: "Gedeeltelijk toegankelijk: het uitkijkpunt ligt op een aarden heuvel (demogegevens).",
      },
      en: {
        name: "Remarkable trees discovery",
        summary: "6 spots, giants from all over the world.",
        description:
          "An easy loop to discover the garden's most impressive trees, a spectacular bloom and a lovely viewpoint. Ideal for families.",
        accessibilityNotes: "Partially accessible: the viewpoint is on an earth mound (demo data).",
      },
      es: { name: "Descubrimiento de árboles notables", summary: "6 puntos, gigantes de todo el mundo." },
      de: { name: "Entdeckung bemerkenswerter Bäume", summary: "6 Spots, Riesen aus aller Welt." },
    },
  },
];

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

const F = (n: number) => demoId("facility", n);

type FacilitySeed = Omit<FacilityRecord, "parkId" | "status" | "isDemoData" | "sortOrder">;

const facilitySeeds: FacilitySeed[] = [
  { id: F(1), type: "ENTRANCE", location: ENTRANCE, isPmrAccessible: true, details: {},
    translations: { fr: { name: "Entrée principale" }, nl: { name: "Hoofdingang" }, en: { name: "Main entrance" } } },
  { id: F(2), type: "PARKING", location: { lat: 50.9306, lng: 4.3285 }, details: { capacity: 250, free: true },
    translations: { fr: { name: "Parking visiteurs" }, nl: { name: "Bezoekersparking" }, en: { name: "Visitor car park" } } },
  { id: F(3), type: "PARKING_PMR", location: { lat: 50.9301, lng: 4.3276 }, isPmrAccessible: true, details: { spaces: 8 },
    translations: { fr: { name: "Parking PMR" }, nl: { name: "Parking voor mindervaliden" }, en: { name: "Accessible parking" } } },
  { id: F(4), type: "BIKE_PARKING", location: { lat: 50.9299, lng: 4.3281 }, details: { spaces: 60 },
    translations: { fr: { name: "Parking vélos" }, nl: { name: "Fietsenstalling" }, en: { name: "Bike parking" } } },
  { id: F(5), type: "TOILETS", location: { lat: 50.9289, lng: 4.3262 }, details: {},
    translations: { fr: { name: "Toilettes" }, nl: { name: "Toiletten" }, en: { name: "Toilets" } } },
  { id: F(6), type: "TOILETS_PMR", location: { lat: 50.9288, lng: 4.3264 }, isPmrAccessible: true, details: {},
    translations: { fr: { name: "Toilettes PMR" }, nl: { name: "Aangepast toilet" }, en: { name: "Accessible toilets" } } },
  { id: F(7), type: "CAFE", location: { lat: 50.92895, lng: 4.3268 }, isPmrAccessible: true, details: {},
    translations: { fr: { name: "Café du jardin" }, nl: { name: "Tuincafé" }, en: { name: "Garden café" } } },
  { id: F(8), type: "BENCH", location: { lat: 50.9266, lng: 4.3255 }, details: {},
    translations: { fr: { name: "Banc ombragé" }, nl: { name: "Schaduwrijke bank" }, en: { name: "Shaded bench" } } },
  { id: F(9), type: "WATER", location: { lat: 50.9279, lng: 4.3259 }, details: {},
    translations: { fr: { name: "Point d'eau potable" }, nl: { name: "Drinkwaterpunt" }, en: { name: "Drinking water" } } },
  { id: F(10), type: "VIEWPOINT", location: { lat: 50.92735, lng: 4.33055 }, details: {},
    translations: { fr: { name: "Belvédère" }, nl: { name: "Belvedère" }, en: { name: "Lookout" } } },
  { id: F(11), type: "PUBLIC_TRANSPORT", location: { lat: 50.9309, lng: 4.3262 }, details: {},
    translations: { fr: { name: "Arrêt de bus" }, nl: { name: "Bushalte" }, en: { name: "Bus stop" } } },
];

export const meiseFacilities: FacilityRecord[] = facilitySeeds.map((f, i) => ({
  ...f,
  parkId: MEISE_ID,
  status: "PUBLISHED",
  isDemoData: true,
  sortOrder: i + 1,
}));

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

const Q = (n: number) => demoId("quiz", n);
const A = (n: number) => demoId("answer", n);

export const meiseQuizzes: QuizRecord[] = [
  {
    id: Q(1),
    parkId: MEISE_ID,
    spotId: S(1),
    status: "PUBLISHED",
    isDemoData: true,
    pointsValue: 10,
    sortOrder: 1,
    translations: {
      fr: { question: "De quel continent vient cet arbre ?", explanation: "Le séquoia géant pousse naturellement en Californie, en Amérique du Nord." },
      nl: { question: "Van welk continent komt deze boom?", explanation: "De mammoetboom groeit van nature in Californië, Noord-Amerika." },
      en: { question: "Which continent does this tree come from?", explanation: "The giant sequoia grows naturally in California, North America." },
      es: { question: "¿De qué continente viene este árbol?" },
      de: { question: "Von welchem Kontinent stammt dieser Baum?" },
    },
    answers: [
      { id: A(1), isCorrect: false, position: 1, translations: { fr: { label: "Europe" }, nl: { label: "Europa" }, en: { label: "Europe" }, es: { label: "Europa" }, de: { label: "Europa" } } },
      { id: A(2), isCorrect: true, position: 2, translations: { fr: { label: "Amérique du Nord" }, nl: { label: "Noord-Amerika" }, en: { label: "North America" }, es: { label: "América del Norte" }, de: { label: "Nordamerika" } } },
      { id: A(3), isCorrect: false, position: 3, translations: { fr: { label: "Asie" }, nl: { label: "Azië" }, en: { label: "Asia" }, es: { label: "Asia" }, de: { label: "Asien" } } },
    ],
  },
  {
    id: Q(2),
    parkId: MEISE_ID,
    spotId: S(2),
    status: "PUBLISHED",
    isDemoData: true,
    pointsValue: 10,
    sortOrder: 2,
    translations: {
      fr: { question: "Comment s'appellent les fruits du chêne ?", explanation: "Ce sont les glands, dont se régalent geais et écureuils." },
      nl: { question: "Hoe heten de vruchten van de eik?", explanation: "Eikels — een feestmaal voor gaaien en eekhoorns." },
      en: { question: "What are the oak's fruits called?", explanation: "Acorns — a feast for jays and squirrels." },
    },
    answers: [
      { id: A(4), isCorrect: true, position: 1, translations: { fr: { label: "Des glands" }, nl: { label: "Eikels" }, en: { label: "Acorns" } } },
      { id: A(5), isCorrect: false, position: 2, translations: { fr: { label: "Des faînes" }, nl: { label: "Beukennootjes" }, en: { label: "Beechnuts" } } },
      { id: A(6), isCorrect: false, position: 3, translations: { fr: { label: "Des cônes" }, nl: { label: "Kegels" }, en: { label: "Cones" } } },
    ],
  },
  {
    id: Q(3),
    parkId: MEISE_ID,
    spotId: S(3),
    status: "PUBLISHED",
    isDemoData: true,
    pointsValue: 10,
    sortOrder: 3,
    translations: {
      fr: { question: "Quels insectes pollinisaient les premiers magnolias ?", explanation: "Les coléoptères : les magnolias sont apparus avant les abeilles." },
      nl: { question: "Welke insecten bestoven de eerste magnolia's?", explanation: "Kevers: magnolia's verschenen vóór de bijen." },
      en: { question: "Which insects pollinated the first magnolias?", explanation: "Beetles: magnolias appeared before bees." },
    },
    answers: [
      { id: A(7), isCorrect: false, position: 1, translations: { fr: { label: "Les abeilles" }, nl: { label: "Bijen" }, en: { label: "Bees" } } },
      { id: A(8), isCorrect: false, position: 2, translations: { fr: { label: "Les papillons" }, nl: { label: "Vlinders" }, en: { label: "Butterflies" } } },
      { id: A(9), isCorrect: true, position: 3, translations: { fr: { label: "Les coléoptères" }, nl: { label: "Kevers" }, en: { label: "Beetles" } } },
    ],
  },
  {
    id: Q(4),
    parkId: MEISE_ID,
    spotId: S(7),
    status: "PUBLISHED",
    isDemoData: true,
    pointsValue: 10,
    sortOrder: 4,
    translations: {
      fr: { question: "Quelle forme ont les feuilles du ginkgo ?", explanation: "Elles sont en éventail, souvent fendues au milieu." },
      nl: { question: "Welke vorm hebben ginkgobladeren?", explanation: "Waaiervormig, vaak in het midden ingesneden." },
      en: { question: "What shape are ginkgo leaves?", explanation: "Fan-shaped, often split in the middle." },
    },
    answers: [
      { id: A(10), isCorrect: true, position: 1, translations: { fr: { label: "En éventail" }, nl: { label: "Waaiervormig" }, en: { label: "Fan-shaped" } } },
      { id: A(11), isCorrect: false, position: 2, translations: { fr: { label: "En aiguille" }, nl: { label: "Naaldvormig" }, en: { label: "Needle-like" } } },
      { id: A(12), isCorrect: false, position: 3, translations: { fr: { label: "En cœur" }, nl: { label: "Hartvormig" }, en: { label: "Heart-shaped" } } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Défis
// ---------------------------------------------------------------------------

const C = (n: number) => demoId("challenge", n);

export const meiseChallenges: ChallengeRecord[] = [
  {
    id: C(1), parkId: MEISE_ID, spotId: S(1), type: "PHOTO", status: "PUBLISHED", isDemoData: true,
    requiresPhoto: true, pointsValue: 20, sortOrder: 1,
    translations: {
      fr: { title: "Prends une photo de la feuille en contre-jour.", instructions: "Place-toi face au soleil et laisse la lumière traverser le feuillage." },
      nl: { title: "Maak een foto van het blad in tegenlicht.", instructions: "Ga met je gezicht naar de zon en laat het licht door het blad schijnen." },
      en: { title: "Take a backlit photo of a leaf.", instructions: "Face the sun and let the light shine through the foliage." },
      es: { title: "Haz una foto de la hoja a contraluz." },
      de: { title: "Fotografiere ein Blatt im Gegenlicht." },
    },
  },
  {
    id: C(2), parkId: MEISE_ID, spotId: S(2), type: "OBSERVATION", status: "PUBLISHED", isDemoData: true,
    requiresPhoto: false, pointsValue: 20, sortOrder: 2,
    translations: {
      fr: { title: "Trouve un gland ou une feuille de chêne au sol.", instructions: "Observe-le, puis laisse-le sur place pour les animaux." },
      nl: { title: "Zoek een eikel of eikenblad op de grond.", instructions: "Bekijk het en laat het liggen voor de dieren." },
      en: { title: "Find an acorn or an oak leaf on the ground.", instructions: "Look at it, then leave it for the animals." },
    },
  },
  {
    id: C(3), parkId: MEISE_ID, spotId: null, type: "WALK", status: "PUBLISHED", isDemoData: true,
    requiresPhoto: false, pointsValue: 20, targetValue: 1000, sortOrder: 3,
    translations: {
      fr: { title: "Marcher 1 km dans le parc" },
      nl: { title: "Wandel 1 km in het park" },
      en: { title: "Walk 1 km in the park" },
    },
  },
  {
    id: C(4), parkId: MEISE_ID, spotId: null, type: "QUIZ_STREAK", status: "PUBLISHED", isDemoData: true,
    requiresPhoto: false, pointsValue: 20, targetValue: 2, sortOrder: 4,
    translations: {
      fr: { title: "Réussir 2 quiz" },
      nl: { title: "Beantwoord 2 quizzen juist" },
      en: { title: "Pass 2 quizzes" },
    },
  },
  {
    id: C(5), parkId: MEISE_ID, spotId: S(5), type: "PHOTO", status: "PUBLISHED", isDemoData: true,
    requiresPhoto: true, pointsValue: 20, sortOrder: 5,
    translations: {
      fr: { title: "Prendre une photo nature depuis le point de vue" },
      nl: { title: "Maak een natuurfoto vanaf het uitkijkpunt" },
      en: { title: "Take a nature photo from the viewpoint" },
    },
  },
];
