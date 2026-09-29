import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActiveEggCard, CollectionCard, CompanionCard } from "@/components/game-core/game-home";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "game" });
  return { title: t("collectionPageTitle") };
}

/** Collection (G1, version minimale) : l'album complet, les fiches et le compagnon arrivent en G5 et G6. */
export default async function CollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("game");
  return (
    <main className="topo-bg mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
      <h1 className="font-display text-3xl font-extrabold">{t("collectionPageTitle")}</h1>
      <CollectionCard />
      <ActiveEggCard />
      <CompanionCard />
      <p className="text-sm text-muted-foreground">{t("albumSoon")}</p>
    </main>
  );
}
