/** Les 7 éléments de départ de TYLIA (une créature par élément au MVP). */
export const ELEMENTS = ["leaf", "water", "flower", "air", "forest", "moon", "sun"] as const;
export type Element = (typeof ELEMENTS)[number];
