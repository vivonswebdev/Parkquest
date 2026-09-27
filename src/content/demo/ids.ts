/**
 * Identifiants UUID déterministes pour les données de démonstration.
 * Ils sont identiques dans l'app (mode démo) et dans supabase/seed.sql,
 * ce qui permet de passer du mode démo à Supabase sans casser les liens.
 */
const NS = {
  park: 1,
  category: 2,
  spot: 3,
  trail: 4,
  segment: 5,
  facility: 6,
  quiz: 7,
  answer: 8,
  challenge: 9,
  badge: 10,
  article: 11,
  articleCategory: 12,
} as const;

export function demoId(ns: keyof typeof NS, n: number): string {
  const nsHex = NS[ns].toString(16).padStart(8, "0");
  return `${nsHex}-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}
