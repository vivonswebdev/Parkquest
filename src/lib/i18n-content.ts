import type { Translations } from "@/lib/domain/types";

/**
 * Choisit la traduction d'un contenu avec repli :
 * langue demandée → anglais → langue principale du parc → première disponible.
 */
export function pickTranslation<T>(
  translations: Translations<T>,
  locale: string,
  parkDefaultLocale = "en",
): { value: T; locale: string } | null {
  const order = [locale, "en", parkDefaultLocale];
  for (const l of order) {
    const v = translations[l];
    if (v) return { value: v, locale: l };
  }
  const first = Object.entries(translations).find(([, v]) => v);
  return first ? { value: first[1] as T, locale: first[0] } : null;
}

/** Variante pour des lignes SQL `{ locale, ...champs }`. */
export function pickRow<R extends { locale: string }>(rows: R[] | null | undefined, locale: string, parkDefaultLocale = "en"): R | null {
  if (!rows || rows.length === 0) return null;
  for (const l of [locale, "en", parkDefaultLocale]) {
    const r = rows.find((x) => x.locale === l);
    if (r) return r;
  }
  return rows[0];
}
