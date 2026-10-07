/*
 * Gardiens du laboratoire de design : créatures originales et fictives (aucune donnée réelle).
 * La rareté est transparente : une condition écrite, jamais de hasard, d'achat ni de compte à rebours.
 */

export type EggId = "forest" | "river" | "dusk";
export type CreatureId = "mossy" | "fougerin" | "galene" | "perline" | "lumo" | "ecorcelle" | "selenis";
export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type Biome = "forest" | "water" | "night";
export type StageId = "egg" | "young" | "explorer" | "guardian" | "lunar";

export const RARITY: Record<Rarity, { label: string; tone: string; ring: string }> = {
  common: { label: "Commune", tone: "#4f7a36", ring: "#8fb36a" },
  uncommon: { label: "Inhabituelle", tone: "#1f6a8a", ring: "#6fb3cf" },
  rare: { label: "Rare", tone: "#5b3f8c", ring: "#a48ad6" },
  legendary: { label: "Légendaire", tone: "#8a5300", ring: "#e9a23b" },
};

export const BIOME_LABEL: Record<Biome, string> = { forest: "Forêt", water: "Eau", night: "Nocturne" };

export interface Creature {
  id: CreatureId;
  name: string;
  title: string;
  biome: Biome;
  habitat: string;
  rarity: Rarity;
  lore: string;
  /** Condition de découverte, toujours écrite */
  unlock: string;
  /** Détails illustrés : zone de la figurine (viewBox) et légende */
  details: { label: string; box: string }[];
}

export const CREATURES: Creature[] = [
  {
    id: "mossy",
    name: "Mossy",
    title: "Gardien mousse",
    biome: "forest",
    habitat: "Sous-bois humides",
    rarity: "common",
    lore: "Il se réveille lorsque les explorateurs prennent le temps d'observer.",
    unlock: "Faire éclore l'Œuf de la forêt",
    details: [
      { label: "Mousse du dos", box: "45 40 110 80" },
      { label: "Pousse curieuse", box: "80 18 50 50" },
      { label: "Socle de mousse", box: "30 150 140 50" },
    ],
  },
  {
    id: "fougerin",
    name: "Fougerin",
    title: "Esprit des fougères",
    biome: "forest",
    habitat: "Lisières ombragées",
    rarity: "common",
    lore: "Sa crosse se déroule un peu plus à chaque étape franchie.",
    unlock: "Terminer 3 étapes d'aventure",
    details: [
      { label: "Crosse de fougère", box: "70 8 90 80" },
      { label: "Feuilles-mains", box: "40 100 120 60" },
    ],
  },
  {
    id: "galene",
    name: "Galène",
    title: "Gardienne des berges",
    biome: "water",
    habitat: "Rives et galets",
    rarity: "common",
    lore: "Elle empile les galets polis par les rivières des parcs visités.",
    unlock: "Découvrir 2 parcs",
    details: [
      { label: "Galets empilés", box: "50 60 100 100" },
      { label: "Touffe de cresson", box: "75 25 60 50" },
    ],
  },
  {
    id: "perline",
    name: "Perline",
    title: "Esprit de goutte d'eau",
    biome: "water",
    habitat: "Ruisseaux et mares",
    rarity: "uncommon",
    lore: "Elle reflète le ciel du moment où on la rencontre.",
    unlock: "Faire éclore l'Œuf de la rivière, ou trouver 3 découvertes",
    details: [
      { label: "Reflet du ciel", box: "60 40 80 80" },
      { label: "Socle de galet", box: "30 150 140 50" },
    ],
  },
  {
    id: "lumo",
    name: "Lumo",
    title: "Luciole gardienne",
    biome: "night",
    habitat: "Clairières au crépuscule",
    rarity: "uncommon",
    lore: "Sa lanterne s'allume doucement pour éclairer les chemins du retour.",
    unlock: "Faire éclore l'Œuf du crépuscule, ou explorer au crépuscule",
    details: [
      { label: "Lanterne organique", box: "100 10 80 80" },
      { label: "Ailes de voile", box: "30 60 140 70" },
    ],
  },
  {
    id: "ecorcelle",
    name: "Écorcelle",
    title: "Esprit du bois",
    biome: "forest",
    habitat: "Forêt ancienne",
    rarity: "rare",
    lore: "Elle veille sur les vieux arbres et se souvient de chaque saison.",
    unlock: "Terminer 2 aventures complètes",
    details: [
      { label: "Écorce sculptée", box: "55 60 90 90" },
      { label: "Couronne de feuilles", box: "55 5 90 60" },
    ],
  },
  {
    id: "selenis",
    name: "Sélénis",
    title: "Gardien du séquoia",
    biome: "forest",
    habitat: "Arbres remarquables",
    rarity: "legendary",
    lore: "Il se montre lorsque la forêt est calme et que les explorateurs prennent le temps d'écouter.",
    unlock: "Terminer 4 aventures dans 4 parcs",
    details: [
      { label: "Étages d'aiguilles", box: "50 10 100 100" },
      { label: "Cônes dorés", box: "40 70 120 70" },
      { label: "Halo ambré", box: "10 0 180 120" },
    ],
  },
];

export const creatureById = (id: string) => CREATURES.find((c) => c.id === id);

export const EGGS: { id: EggId; label: string; biome: string; clue: string; hatches: CreatureId }[] = [
  { id: "forest", label: "Œuf de la forêt", biome: "Forêt · mousse, feuilles et écorce", clue: "Patient et curieux, il aime les sous-bois calmes.", hatches: "mossy" },
  { id: "river", label: "Œuf de la rivière", biome: "Eau · gouttes, galets et reflets", clue: "Joueur et vif, il suit le chant de l'eau.", hatches: "perline" },
  { id: "dusk", label: "Œuf du crépuscule", biome: "Nuit douce · étoiles, fougères et lueurs", clue: "Rêveur et discret, il s'éveille quand le jour décline.", hatches: "lumo" },
];

export const eggById = (id: EggId) => EGGS.find((e) => e.id === id) ?? EGGS[0];

/** Noms de la lignée d'évolution (illustrée pour chaque compagnon possible). */
export const LINEAGE: Record<"mossy" | "perline" | "lumo", Record<Exclude<StageId, "egg">, string>> = {
  mossy: { young: "Mossy, jeune gardien", explorer: "Mossy, explorateur des sous-bois", guardian: "Mossy, gardien de la forêt", lunar: "Mossy lunaire" },
  perline: { young: "Perline, jeune gardienne", explorer: "Perline, exploratrice des ruisseaux", guardian: "Perline, gardienne de la rivière", lunar: "Perline lunaire" },
  lumo: { young: "Lumo, jeune gardien", explorer: "Lumo, explorateur des clairières", guardian: "Lumo, gardien des lueurs", lunar: "Lumo lunaire" },
};

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
