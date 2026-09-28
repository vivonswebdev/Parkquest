import { ExternalLink, Leaf } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import type { SpeciesInfo } from "@/lib/species/parse";

const IUCN = ["LC", "NT", "VU", "EN", "CR", "EW", "EX", "DD"] as const;

/** Fiche espèce (sources ouvertes) : nom commun, famille, statut UICN, observations, liens. */
export async function SpeciesCard({ info, spotName }: { info: SpeciesInfo; spotName: string }) {
  const t = await getTranslations("species");
  const locale = await getLocale();
  const iucn = IUCN.find((c) => c === info.iucn);
  const rows = [
    info.commonName && info.commonName.toLowerCase() !== spotName.toLowerCase() ? { label: t("commonName"), value: info.commonName } : null,
    info.family ? { label: t("family"), value: info.family } : null,
    iucn ? { label: t("iucn"), value: `${t(`iucnLabels.${iucn}`)} (${iucn})` } : null,
    info.observationsCount ? { label: t("observations"), value: new Intl.NumberFormat(locale).format(info.observationsCount) } : null,
  ].filter((r): r is { label: string; value: string } => Boolean(r));
  const links = [
    info.inaturalistUrl && { href: info.inaturalistUrl, label: "iNaturalist" },
    info.gbifUrl && { href: info.gbifUrl, label: "GBIF" },
    info.wikipediaUrl && { href: info.wikipediaUrl, label: "Wikipédia" },
  ].filter((l): l is { href: string; label: string } => Boolean(l));
  if (!rows.length && !links.length) return null;

  return (
    <Card className="p-5">
      <h2 className="light-serif flex items-center gap-2 text-xl font-bold">
        <Leaf className="size-5 text-primary" /> {t("title")}
      </h2>
      <p className="mt-0.5 text-sm italic text-muted-foreground">{info.scientificName}</p>
      {rows.length > 0 && (
        <dl className="mt-3 divide-y divide-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 py-2 text-sm">
              <dt className="text-muted-foreground">{r.label}</dt>
              <dd className="text-right font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {links.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">{t("learnMore")} :</span>
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">
              {l.label} <ExternalLink className="size-3.5" />
            </a>
          ))}
        </p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">{t("sources")}</p>
    </Card>
  );
}
