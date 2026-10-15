/*
 * Les sept familles de gardiens du laboratoire de design (prototype uniquement).
 * - Identifiants techniques stables (`leaf`, `water`…) ; les noms affichés sont modifiables à part (NAMES).
 * - Visuels : images fournies par la personne porteuse du projet (voir design-assets/lab-creatures/PROVENANCE.md),
 *   jamais publiées hors du prototype.
 * - Rareté transparente : une condition écrite, jamais de hasard, d'achat ni de compte à rebours.
 *   Conditions et raretés = PROPOSITIONS PROVISOIRES (non validées) : reprise des anciennes conditions du
 *   prototype, réparties sur les sept familles (voir RULE_ORIGIN). Les familles sont des identités, pas des
 *   niveaux de rareté.
 */

export type EggId = "forest" | "river" | "dusk";
export type FamilyId = "leaf" | "water" | "flower" | "air" | "forest" | "lunar" | "solar";
export type CreatureId = FamilyId;
export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type StageId = "egg" | "young" | "explorer" | "guardian" | "lunar";

export const RARITY: Record<Rarity, { label: string; tone: string; ring: string }> = {
  common: { label: "Commune", tone: "#4f7a36", ring: "#8fb36a" },
  uncommon: { label: "Inhabituelle", tone: "#1f6a8a", ring: "#6fb3cf" },
  rare: { label: "Rare", tone: "#5b3f8c", ring: "#a48ad6" },
  legendary: { label: "Légendaire", tone: "#8a5300", ring: "#e9a23b" },
};

/** Noms affichés (provisoires, modifiables sans toucher aux identifiants). */
export const NAMES: Record<FamilyId, string> = {
  leaf: "Mossy",
  water: "Perline",
  flower: "Floréa",
  air: "Zéphyr",
  forest: "Mycélio",
  lunar: "Lumo",
  solar: "Soléa",
};

export const FAMILY_LABEL: Record<FamilyId, string> = {
  leaf: "Feuille",
  water: "Eau",
  flower: "Fleur",
  air: "Air",
  forest: "Forêt",
  lunar: "Lunaire",
  solar: "Solaire",
};

export interface Creature {
  id: CreatureId;
  /** Nom affiché (provisoire) */
  name: string;
  family: string;
  title: string;
  habitat: string;
  rarity: Rarity;
  lore: string;
  /** Condition de découverte, toujours écrite (provisoire) */
  unlock: string;
  /** Teinte d'ambiance de la fiche */
  tint: string;
}

const base: Omit<Creature, "name" | "family">[] = [
  {
    id: "leaf",
    title: "Gardien des feuillages",
    habitat: "Jeunes pousses et sous-bois clairs",
    rarity: "common",
    lore: "Il se réveille lorsque les explorateurs prennent le temps d'observer.",
    unlock: "Faire éclore l'Œuf de la forêt",
    tint: "#e4ecd2",
  },
  {
    id: "water",
    title: "Esprit de goutte d'eau",
    habitat: "Ruisseaux, mares et galets",
    rarity: "uncommon",
    lore: "Elle reflète le ciel du moment où on la rencontre.",
    unlock: "Faire éclore l'Œuf de la rivière, ou trouver 3 découvertes",
    tint: "#d6edf3",
  },
  {
    id: "flower",
    title: "Esprit des pétales",
    habitat: "Prairies fleuries et massifs",
    rarity: "common",
    lore: "Ses pétales s'ouvrent un peu plus à chaque étape franchie.",
    unlock: "Terminer 3 étapes d'aventure",
    tint: "#f6e4e0",
  },
  {
    id: "air",
    title: "Graine du vent",
    habitat: "Clairières venteuses et belvédères",
    rarity: "common",
    lore: "Il voyage d'un parc à l'autre, porté par la brise.",
    unlock: "Découvrir 2 parcs",
    tint: "#e7edf1",
  },
  {
    id: "forest",
    title: "Gardien des champignons",
    habitat: "Forêt ancienne, souches et mousses",
    rarity: "rare",
    lore: "Il veille sur les vieux arbres et allume ses lanternes quand la forêt s'assombrit.",
    unlock: "Terminer 2 aventures complètes",
    tint: "#ece4cf",
  },
  {
    id: "lunar",
    title: "Gardien du crépuscule",
    habitat: "Clairières au crépuscule",
    rarity: "uncommon",
    lore: "Ses lueurs s'allument doucement pour éclairer les chemins du retour.",
    unlock: "Faire éclore l'Œuf du crépuscule, ou explorer au crépuscule",
    tint: "#e4e1f2",
  },
  {
    id: "solar",
    title: "Esprit de lumière",
    habitat: "Clairières ensoleillées et arbres remarquables",
    rarity: "legendary",
    lore: "Il se montre quand la lumière traverse les feuilles et que l'on prend le temps de s'arrêter.",
    unlock: "Terminer 4 aventures dans 4 parcs",
    tint: "#f7ead0",
  },
];

export const CREATURES: Creature[] = base.map((c) => ({ ...c, name: NAMES[c.id], family: FAMILY_LABEL[c.id] }));

export const creatureById = (id: string) => CREATURES.find((c) => c.id === id);

/**
 * Origine de chaque condition proposée : reprise telle quelle d'une condition des anciens gardiens
 * du prototype. Transfert provisoire, à valider.
 */
export const RULE_ORIGIN: Record<FamilyId, { previous: string; same: boolean }> = {
  leaf: { previous: "Mossy (gardien mousse)", same: true },
  water: { previous: "Perline", same: true },
  lunar: { previous: "Lumo", same: true },
  flower: { previous: "Fougerin", same: true },
  air: { previous: "Galène", same: true },
  forest: { previous: "Écorcelle (rare)", same: true },
  solar: { previous: "Sélénis (légendaire)", same: true },
};

export const EGGS: { id: EggId; label: string; biome: string; clue: string; hatches: FamilyId }[] = [
  { id: "forest", label: "Œuf de la forêt", biome: "Forêt · mousse, feuilles et écorce", clue: "Patient et curieux, il aime les sous-bois calmes.", hatches: "leaf" },
  { id: "river", label: "Œuf de la rivière", biome: "Eau · gouttes, galets et reflets", clue: "Joueur et vif, il suit le chant de l'eau.", hatches: "water" },
  { id: "dusk", label: "Œuf du crépuscule", biome: "Nuit douce · étoiles, fougères et lueurs", clue: "Rêveur et discret, il s'éveille quand le jour décline.", hatches: "lunar" },
];

export const eggById = (id: EggId) => EGGS.find((e) => e.id === id) ?? EGGS[0];

export type StarterId = "leaf" | "water" | "lunar";

const STAGE_TITLES: Record<StarterId, Record<Exclude<StageId, "egg">, string>> = {
  leaf: { young: "jeune gardien", explorer: "explorateur des sous-bois", guardian: "gardien des feuillages", lunar: "forme nocturne" },
  water: { young: "jeune gardienne", explorer: "exploratrice des ruisseaux", guardian: "gardienne de la rivière", lunar: "forme nocturne" },
  lunar: { young: "jeune gardien", explorer: "explorateur des clairières", guardian: "gardien des lueurs", lunar: "forme de pleine lune" },
};

/** Noms de la lignée d'évolution, construits à partir du nom affiché (renommage sans effort). */
export const LINEAGE = Object.fromEntries(
  (Object.keys(STAGE_TITLES) as StarterId[]).map((id) => [
    id,
    Object.fromEntries(Object.entries(STAGE_TITLES[id]).map(([st, t]) => [st, `${NAMES[id]}, ${t}`])),
  ]),
) as Record<StarterId, Record<Exclude<StageId, "egg">, string>>;

export const STAGE_ORDER: StageId[] = ["egg", "young", "explorer", "guardian", "lunar"];

export const STAGE_LABEL: Record<StageId, string> = {
  egg: "Œuf",
  young: "Jeune gardien",
  explorer: "Explorateur",
  guardian: "Gardien",
  lunar: "Forme nocturne",
};

/** Condition pour atteindre chaque stade (affichée telle quelle). */
export const STAGE_CONDITION: Record<StageId, string> = {
  egg: "Choisir un œuf",
  young: "Première découverte, puis éclosion",
  explorer: "2 aventures terminées",
  guardian: "4 parcs découverts",
  lunar: "1 aventure au crépuscule",
};
