import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { repo } from "@/lib/data";
import { placesRepo } from "@/lib/places/data";
import { isDisplayableMedia } from "@/lib/places/rules";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "credits" });
  return { title: t("title") };
}

/** Crédits et licences : carte, données d'espèces, photos (publiées ou en attente), illustrations, sources des parcs. */
export default async function CreditsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("credits");
  const parks = await repo.listParks(locale);
  const media = placesRepo.listMedia();
  const published = media.filter(isDisplayableMedia);
  const pending = media.filter((m) => !isDisplayableMedia(m));

  return (
    <>
      <main className="mx-auto max-w-3xl space-y-5 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <h1 className="font-display text-3xl font-extrabold">{t("title")}</h1>

        <Card className="space-y-1 p-5">
          <h2 className="text-lg font-bold">{t("mapTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("mapBody")}</p>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            © OpenStreetMap contributors <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </Card>

        <Card className="space-y-1 p-5">
          <h2 className="text-lg font-bold">{t("speciesTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("speciesBody")}</p>
        </Card>

        <Card className="space-y-2 p-5">
          <h2 className="text-lg font-bold">{t("photosTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("photosBody")}</p>
          {published.length === 0 && <p className="text-sm font-semibold">{t("noPublishedPhotos")}</p>}
          <ul className="space-y-1.5 text-sm">
            {published.map((m) => (
              <li key={m.id}>
                <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{m.attribution ?? m.author}</a> · {m.license}
              </li>
            ))}
          </ul>
          {pending.length > 0 && (
            <>
              <h3 className="pt-2 text-sm font-bold">{t("pendingTitle", { count: pending.length })}</h3>
              <ul className="space-y-1 text-xs">
                {pending.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-1.5">
                    <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">
                      {decodeURIComponent(m.sourceUrl.split("File:")[1] ?? m.sourceUrl)}
                    </a>
                    <Pill size="sm" tone="demo">{t("toVerify")}</Pill>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="space-y-1 p-5">
          <h2 className="text-lg font-bold">{t("illustrationsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("illustrationsBody")}</p>
        </Card>

        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-bold">{t("parkSourcesTitle")}</h2>
          {parks.map((p) => {
            const profile = placesRepo.getProfile(p.slug);
            if (!profile) return null;
            return (
              <div key={p.id}>
                <p className="font-semibold">{p.name}</p>
                <ul className="mt-1 space-y-1 text-sm">
                  {profile.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        {s.label} <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
