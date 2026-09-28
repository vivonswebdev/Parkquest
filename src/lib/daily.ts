/**
 * Sélection « du jour » : rotation déterministe selon la date UTC,
 * le même élément pour tout le monde pendant une journée.
 */
export function pickDaily<T>(items: readonly T[], now: Date = new Date()): T | null {
  if (!items.length) return null;
  const day = Math.floor(now.getTime() / 86_400_000);
  return items[day % items.length];
}
