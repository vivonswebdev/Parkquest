import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ParkMapExplorer } from "@/components/map/park-map-explorer";
import { listSpots, listTrails, repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { getServerProgress } from "@/server/progress";

type Params = { params: Promise<{ locale: string; parkSlug: string }>; searchParams: Promise<{ to?: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "map" });
  return { title: t("title") };
}

export default async function ParkMapPage({ params, searchParams }: Params) {
  const { locale, parkSlug } = await params;
  const { to } = await searchParams;
  setRequestLocale(locale);
  const park = await requirePark(parkSlug, locale);
  const [spots, facilities, categories, trails, challenges, progress] = await Promise.all([
    listSpots(park.id, locale),
    repo.listFacilities(park.id, locale),
    repo.listCategories(locale),
    listTrails(park.id, locale),
    repo.listChallenges(park.id, locale),
    getServerProgress(),
  ]);
  const trail = trails[0] ? await repo.getTrail(park.id, trails[0].slug, locale) : null;
  const entrance = facilities.find((f) => f.type === "ENTRANCE")?.location ?? trail?.start ?? park.location;

  return (
    <main>
      <h1 className="sr-only">{park.name}</h1>
      <ParkMapExplorer
        park={{ slug: park.slug, name: park.name, bounds: park.bounds, isDemoData: park.isDemoData }}
        spots={spots}
        facilities={facilities}
        categories={categories}
        trailSegments={trail?.segments ?? []}
        entrance={entrance}
        challengeSpotIds={challenges.map((c) => c.spotId).filter((x): x is string => Boolean(x))}
        photoSpotIds={challenges.filter((c) => c.type === "PHOTO").map((c) => c.spotId).filter((x): x is string => Boolean(x))}
        initialGuideSlug={to}
        serverDiscovered={progress?.discoveredSpotIds ?? null}
      />
    </main>
  );
}
