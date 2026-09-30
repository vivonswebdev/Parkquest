import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ExplorationRunner, type QuestStop } from "@/components/exploration/exploration-runner";
import { repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { findQuest } from "@/lib/quests/catalog";
import { questDefinition } from "@/lib/quests/definitions";
import { questLegs } from "@/lib/quests/legs";

type Params = { params: Promise<{ locale: string; parkSlug: string; questSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, parkSlug, questSlug } = await params;
  const quest = findQuest(parkSlug, questSlug);
  if (!quest) return {};
  const t = await getTranslations({ locale, namespace: "explore" });
  return { title: t(`quests.${quest.key}.title`) };
}

/** Mode Exploration : une quête plein écran sur les chemins d'un parc. */
export default async function ExplorePage({ params }: Params) {
  const { locale, parkSlug, questSlug } = await params;
  setRequestLocale(locale);
  const quest = findQuest(parkSlug, questSlug);
  const def = quest && questDefinition(quest.slug);
  if (!quest || !def) notFound();
  const park = await requirePark(parkSlug, locale);
  const trail = await repo.getTrail(park.id, quest.trailSlug, locale);
  if (!trail) notFound();

  // Spots des étapes (un spot peut revenir : départ et trésor au Séquoia)
  const slugs = [...new Set(def.steps.map((s) => s.spotSlug))];
  const spots = await Promise.all(slugs.map((slug) => repo.getSpot(park.id, slug, locale)));
  const bySlug = new Map(spots.flatMap((s) => (s ? [[s.slug, s] as const] : [])));
  if (bySlug.size !== slugs.length) notFound();

  const stops: QuestStop[] = def.steps.map((st) => {
    const s = bySlug.get(st.spotSlug)!;
    return { spot: { id: s.id, slug: s.slug, name: s.name, kind: s.kind, location: s.location, radiusM: s.discoveryRadiusM } };
  });
  const quizStep = def.steps.find((s) => s.activity === "quiz");
  const quizzes = quizStep ? await repo.listQuizzesForSpot(bySlug.get(quizStep.spotSlug)!.id, locale) : [];

  return (
    <main>
      <ExplorationRunner
        quest={quest}
        def={def}
        stops={stops}
        legs={questLegs(trail.start, stops.map((s) => s.spot.location))}
        start={trail.start}
        quizzes={quizzes}
        backHref={`/parks/${park.slug}/trails/${trail.slug}`}
      />
    </main>
  );
}
