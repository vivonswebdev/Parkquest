import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { ParkCard } from "@/components/park/park-card";
import { ParksExplorer } from "@/components/parks/parks-explorer";
import { DemoNotice } from "@/components/shared/demo-badge";
import { repo } from "@/lib/data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "parks" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function ParksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("parks");
  const parks = await repo.listParks(locale);
  // Cartes rendues côté serveur, filtrage interactif côté client.
  const cards = Object.fromEntries(parks.map((p) => [p.id, <ParkCard key={p.id} park={p} />]));

  return (
    <>
      <main className="topo-bg mx-auto max-w-7xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <header>
          <h1 className="font-display text-3xl font-extrabold md:text-5xl">{t("title")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{t("subtitle")}</p>
        </header>
        <ParksExplorer parks={parks} cards={cards} />
        {parks.some((p) => p.isDemoData) && <DemoNotice />}
      </main>
      <SiteFooter />
    </>
  );
}
