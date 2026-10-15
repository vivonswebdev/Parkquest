import { ChevronRight, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { ActiveEggCard, CollectionCard, CompanionCard } from "@/components/game-core/game-home";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBadge } from "@/components/shared/demo-badge";
import { ThemeToggle } from "@/components/theme/theme-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getPark } from "@/lib/data";
import { QUESTS } from "@/lib/quests/catalog";
import { questDefinition } from "@/lib/quests/definitions";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: { absolute: t("title") } };
}

/**
 * Accueil global du jeu TYLIA (G1) : l'univers du joueur (œuf actif, compagnon, collection),
 * puis les aventures proposées dans les parcs. Aucun parc n'est mis en avant d'office.
 * Progression de démonstration, sur l'appareil uniquement.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  // Aventures proposées (catalogue local de démonstration), avec le nom de leur parc.
  const adventures = (
    await Promise.all(
      QUESTS.map(async (q) => {
        const park = await getPark(q.parkSlug, locale);
        const def = questDefinition(q.slug);
        return park && def ? { quest: q, parkName: park.name, parkSlug: park.slug, steps: def.steps.length } : null;
      }),
    )
  ).filter((a): a is NonNullable<typeof a> => a !== null);
  // Événements : aucun pour l'instant → le bloc est masqué.
  const events: never[] = [];

  return (
    <>
      <main className="topo-bg mx-auto max-w-5xl px-4 pb-32 pt-[max(env(safe-area-inset-top),1rem)] md:px-6 md:pb-16 md:pt-8">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="size-11 md:hidden" />
            <h1 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">{t("game.hello")}</h1>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start">
          <div className="space-y-4">
            <ActiveEggCard />
            <CompanionCard />
            <CollectionCard />
          </div>

          <div className="space-y-4">
            <section aria-labelledby="near-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-4 card-shadow">
              <p id="near-title" className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {t("game.nearTitle")}
              </p>
              <ul className="mt-2 space-y-3">
                {adventures.map((a) => (
                  <li key={a.quest.slug} className="rounded-2xl bg-inset p-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden /> {a.parkName}
                      {a.quest.status === "demo" && <DemoBadge className="ml-1" />}
                    </p>
                    <p className="mt-0.5 font-display text-lg font-bold">{t(`explore.quests.${a.quest.key}.title`)}</p>
                    <p className="text-sm text-muted-foreground">{t("game.adventureSteps", { count: a.steps })}</p>
                    <Button asChild variant="secondary" size="sm" className="mt-2">
                      <Link href={`/parks/${a.parkSlug}/explore/${a.quest.slug}`}>
                        {t("game.seeAdventure")} <ChevronRight />
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
              <Link href="/map" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                {t("game.allParks")} <ChevronRight className="size-4" />
              </Link>
            </section>

            {events.length > 0 && (
              <section aria-labelledby="events-title" className="rounded-[var(--radius-card)] border border-border bg-surface p-4">
                <p id="events-title" className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                  {t("game.eventsTitle")}
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
