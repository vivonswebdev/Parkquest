import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { VisitPlanner } from "@/components/plan/visit-planner";
import { Link } from "@/i18n/navigation";
import { listTrails } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";

type Params = { params: Promise<{ locale: string; parkSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plan" });
  return { title: t("title") };
}

export default async function PlanPage({ params }: Params) {
  const { locale, parkSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const park = await requirePark(parkSlug, locale);
  const trails = await listTrails(park.id, locale);
  return (
    <>
      <main className="topo-bg mx-auto max-w-3xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <Link href={`/parks/${park.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {park.name}
        </Link>
        <header>
          <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t("plan.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("plan.subtitle")}</p>
        </header>
        <VisitPlanner trails={trails} parkSlug={park.slug} />
      </main>
      <SiteFooter />
    </>
  );
}
