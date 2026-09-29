import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ParksMapExplorer } from "@/components/map/parks-map-explorer";
import { FEATURED_PARK_SLUG, repo } from "@/lib/data";
import { QUESTS } from "@/lib/quests/catalog";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "map" });
  return { title: t("generalTitle") };
}

/**
 * Carte générale : tous les parcs, centrée sur l'utilisateur si sa position est connue.
 * Aucun parc n'est sélectionné d'office ; un parc s'ouvre seulement par un geste explicite
 * (repère touché, choix dans la liste, « Parc le plus proche ») ou par un lien direct vers ce parc.
 */
export default async function MapPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "map" });
  const parks = await repo.listParks(locale);
  // Zone de repli clairement annoncée si la position est indisponible (parc pilote, jamais sélectionné).
  const demoZone = parks.find((p) => p.slug === FEATURED_PARK_SLUG)?.location ?? parks[0]?.location ?? { lat: 50.85, lng: 4.35 };
  return (
    <main>
      <h1 className="sr-only">{t("generalTitle")}</h1>
      <ParksMapExplorer
        parks={parks.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          city: p.city,
          location: p.location,
          spotCount: p.spotCount,
          trailCount: p.trailCount,
          isDemoData: p.isDemoData,
          adventureHref: (() => {
            const q = QUESTS.find((x) => x.parkSlug === p.slug);
            return q ? `/parks/${p.slug}/explore/${q.slug}` : undefined;
          })(),
        }))}
        demoZone={demoZone}
      />
    </main>
  );
}
