import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExplorationRunner } from "@/components/exploration/exploration-runner";
import { repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { findQuest } from "@/lib/quests/catalog";

type Params = { params: Promise<{ locale: string; parkSlug: string; questSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, parkSlug, questSlug } = await params;
  const quest = findQuest(parkSlug, questSlug);
  if (!quest) return {};
  const t = await getTranslations({ locale, namespace: "explore" });
  return { title: t(`quests.${quest.key}.title`) };
}

/** Mode Exploration : une aventure plein écran sur les chemins d'un parcours. */
export default async function ExplorePage({ params }: Params) {
  const { locale, parkSlug, questSlug } = await params;
  setRequestLocale(locale);
  const quest = findQuest(parkSlug, questSlug);
  if (!quest) notFound();
  const park = await requirePark(parkSlug, locale);
  const trail = await repo.getTrail(park.id, quest.trailSlug, locale);
  if (!trail) notFound();

  return (
    <main>
      <ExplorationRunner park={{ slug: park.slug, bounds: park.bounds }} quest={quest} trail={trail} />
    </main>
  );
}
