import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VisitRunner } from "@/components/visit/visit-runner";
import { repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import type { Challenge, PublicQuiz } from "@/lib/domain/types";
import { getServerProgress } from "@/server/progress";

type Params = {
  params: Promise<{ locale: string; parkSlug: string; trailSlug: string }>;
  searchParams: Promise<{ spot?: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return { title: t("startVisit") };
}

export default async function VisitPage({ params, searchParams }: Params) {
  const { locale, parkSlug, trailSlug } = await params;
  const { spot } = await searchParams;
  setRequestLocale(locale);
  const park = await requirePark(parkSlug, locale);
  const trail = await repo.getTrail(park.id, trailSlug, locale);
  if (!trail) notFound();

  const [quizLists, challenges, progress] = await Promise.all([
    Promise.all(trail.spots.map((s) => repo.listQuizzesForSpot(s.id, locale))),
    repo.listChallenges(park.id, locale),
    getServerProgress(),
  ]);
  const quizzesBySpot: Record<string, PublicQuiz[]> = Object.fromEntries(trail.spots.map((s, i) => [s.id, quizLists[i]]));
  const challengesBySpot: Record<string, Challenge[]> = {};
  for (const c of challenges) if (c.spotId) (challengesBySpot[c.spotId] ??= []).push(c);

  return (
    <main>
      <h1 className="sr-only">{trail.name}</h1>
      <VisitRunner
        park={{ id: park.id, slug: park.slug, name: park.name, bounds: park.bounds }}
        trail={trail}
        quizzesBySpot={quizzesBySpot}
        challengesBySpot={challengesBySpot}
        serverDiscovered={progress?.discoveredSpotIds ?? null}
        initialSpotSlug={spot}
      />
    </main>
  );
}
