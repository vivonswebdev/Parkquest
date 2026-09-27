/** Distance lisible : « 180 m », « 1,8 km ». */
export function formatDistance(meters: number, locale: string): string {
  if (meters < 1000) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(meters / 10) * 10 || Math.round(meters))} m`;
  }
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
}

/** Durée lisible : « 45 min », « 1 h 30 ». */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export function formatNumber(n: number, locale: string, digits = 0): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
}
