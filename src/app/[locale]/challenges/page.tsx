import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionProgress } from "@/components/game/collection-progress";
import { BadgeGrid, ChallengeList, PointsHeadline } from "@/components/game/progress-dashboard";
import { demoUser } from "@/features/demo/demo-data";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoNotice } from "@/components/shared/demo-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { Card } from "@/components/ui/card";
import { FEATURED_PARK_SLUG, listSpots, repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { isDemoMode } from "@/lib/config/app-mode";
import { getServerProgress } from "@/server/progress";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "challenges" });
  return { title: t("title") };
}

export default async function ChallengesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const park = await requirePark(FEATURED_PARK_SLUG, locale);
  const [spots, challenges, badges, live] = await Promise.all([
    listSpots(park.id, locale),
    repo.listChallenges(park.id, locale),
    repo.listBadges(locale),
    getServerProgress(),
  ]);

  return (
    <>
      <main className="topo-bg mx-auto max-w-5xl space-y-8 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <header>
          <p className="text-muted-foreground">{t("challenges.hello", { name: live?.username || (isDemoMode ? demoUser.displayName : t("home.guest")) })}</p>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t("challenges.today")}</h1>
        </header>

        <Card className="relative overflow-hidden p-5">
          <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex items-end justify-between gap-4">
            <PointsHeadline live={live} />
            <Sparkles className="size-8 text-gold" />
          </div>
          <CollectionProgress className="relative mt-5" parkName={park.name} spotIds={spots.map((s) => s.id)} serverDiscovered={live?.discoveredSpotIds} />
        </Card>

        {isDemoMode && <DemoNotice kind="mode" />}

        <section>
          <SectionHeader title={t("challenges.active")} />
          <ChallengeList challenges={challenges} live={live} />
        </section>

        <section>
          <SectionHeader title={t("challenges.recentBadges")} />
          <BadgeGrid badges={badges} live={live} />
        </section>

        <Card className="p-5">
          <h2 className="font-bold">{t("challenges.howPointsWork")}</h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {(["spot", "quiz", "challenge", "trail", "photo"] as const).map((k) => (
              <li key={k} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />{t(`challenges.rules.${k}`)}</li>
            ))}
          </ul>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
