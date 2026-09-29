import { Clock, ExternalLink, FlaskConical, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { placesRepo } from "@/lib/places/data";
import { effectiveStatus } from "@/lib/places/rules";
import type { ContentStatus } from "@/lib/places/types";

/** Étiquette de statut : jamais « vérifié » sans source et validation réelles (voir lib/places/rules). */
async function StatusPill({ status }: { status: ContentStatus }) {
  const t = await getTranslations("parkInfo");
  return (
    <Pill size="sm" tone={status === "park_verified" || status === "published" ? "mint" : "demo"}>
      {t(`status.${status}`)}
    </Pill>
  );
}

/**
 * Sections génériques d'une fiche de parc, adaptées à son contenu réel : particularités, lieux
 * proposés, horaires et accès (renvoi aux sources officielles), sources et statut des données.
 */
export async function ParkProfileSections({ parkSlug }: { parkSlug: string }) {
  const profile = placesRepo.getProfile(parkSlug);
  if (!profile) return null;
  const t = await getTranslations("parkInfo");
  const locale = (await getLocale()) as "fr" | "nl" | "en";
  const places = placesRepo.listPlaces(parkSlug);
  const status = effectiveStatus({ status: profile.dataStatus });

  return (
    <>
      <p role="note" className="flex items-start gap-2 rounded-2xl border border-gold/25 bg-gold/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-gold/90">
        <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {t("dataNotice")}
      </p>

      {profile.features.length > 0 && (
        <section aria-labelledby="features-title">
          <h2 id="features-title" className="text-xl font-bold">{t("particularities")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.features.map((f) => (
              <li key={f.feature}>
                <Pill>{t(`features.${f.feature}`)}</Pill>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="places" aria-labelledby="places-title" className="scroll-mt-24">
        <h2 id="places-title" className="text-xl font-bold">{t("placesTitle")}</h2>
        {/* Tant que lieux, coordonnées, horaires, accessibilité, photos, règles et limites ne sont pas
            vérifiés avec le gestionnaire ou une source officielle : « Contenu en préparation ». */}
        {profile.contentInPreparation && (
          <Card className="mt-3 flex items-center gap-3 p-5 text-muted-foreground">
            <Clock className="size-5 shrink-0 text-primary" /> {t("contentInPreparation")}
          </Card>
        )}
        {places.length > 0 && (
          <>
            <p className="mt-1 text-sm text-muted-foreground">{t("placesProposedNote")}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {places.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden>
                    <MapPin className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{p.name[locale] ?? p.name.fr}</span>
                    <span className="block text-xs text-muted-foreground">{t(`features.${p.category}`)}</span>
                  </span>
                  <StatusPill status={effectiveStatus(p)} />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold">{t("hoursAccess")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("hoursAccessBody")}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{t("sources")}</h2>
            <StatusPill status={status} />
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {profile.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                  {s.label} <ExternalLink className="size-3.5" aria-hidden />
                </a>
                <span className="ml-1 text-xs text-muted-foreground">· {s.checkedAt ? t("sourceChecked", { date: s.checkedAt }) : t("sourceUnchecked")}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
