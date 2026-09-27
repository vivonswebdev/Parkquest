import { ArrowLeft, Clock, Download, Info, Map, MapPin, Play, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionProgress } from "@/components/game/collection-progress";
import { SiteFooter } from "@/components/layout/site-footer";
import { SpotTile } from "@/components/park/spot-tile";
import { TrailCard } from "@/components/park/trail-card";
import { DemoBadge, DemoNotice } from "@/components/shared/demo-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { getPark, listSpots, listTrails } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { getServerProgress } from "@/server/progress";

type Params = { params: Promise<{ locale: string; parkSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, parkSlug } = await params;
  const park = await getPark(parkSlug, locale);
  return park ? { title: park.name, description: park.tagline } : {};
}

export default async function ParkPage({ params }: Params) {
  const { locale, parkSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const park = await requirePark(parkSlug, locale);
  const [trails, spots, progress] = await Promise.all([listTrails(park.id, locale), listSpots(park.id, locale), getServerProgress()]);
  const main = trails[0];

  return (
    <>
      <main className="pb-32 md:pb-16">
        <section className="relative">
          <div className="relative h-[52vh] min-h-[360px] md:h-[440px]">
            <Image src={park.coverImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="image-scrim absolute inset-0" />
          </div>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)] md:hidden">
            <Link href="/parks" aria-label={t("common.back")} className="inline-flex size-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
              <ArrowLeft className="size-5" />
            </Link>
            {park.isDemoData && <DemoBadge />}
          </div>
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-7xl px-4 pb-6 md:px-6">
            <Pill tone="glass">{t(`parkType.${park.type}`)}</Pill>
            <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">{park.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4" /> {park.city}, {park.countryCode}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-10 px-4 pt-4 md:px-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            {main && (
              <Button asChild size="lg">
                <Link href={`/parks/${park.slug}/trails/${main.slug}/visit`}>
                  <Play className="fill-current" /> {t("common.startVisit")}
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="secondary">
              <Link href={`/parks/${park.slug}/map`}><Map /> {t("park.openMap")}</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={`/parks/${park.slug}/practical-info`}><Info /> {t("park.practicalInfo")}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href={`/parks/${park.slug}/plan`}><Sparkles /> {t("home.planVisit")}</Link>
            </Button>
          </div>

          {park.isDemoData && <DemoNotice />}

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <Card className="p-5">
              <h2 className="text-xl font-bold">{t("park.about")}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{park.description ?? park.tagline}</p>
              {park.contentLocale !== locale && <p className="mt-3 text-xs text-muted-foreground/80">{t("common.contentFallback", { locale: park.contentLocale.toUpperCase() })}</p>}
            </Card>
            <Card className="space-y-4 p-5">
              {spots.length > 0 && (
                <CollectionProgress parkName={park.name} spotIds={spots.map((s) => s.id)} serverDiscovered={progress?.discoveredSpotIds} />
              )}
              <div className="flex items-start gap-3 rounded-2xl bg-muted p-3">
                <Download className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t("park.downloadPark")} <Pill tone="muted" size="sm" className="ml-1">{t("common.comingSoon")}</Pill></p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("park.downloadParkHint")}</p>
                </div>
              </div>
            </Card>
          </div>

          <section id="trails" className="scroll-mt-24">
            <SectionHeader title={t("park.trails")} />
            {trails.length ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trails.map((tr) => <TrailCard key={tr.id} trail={tr} parkSlug={park.slug} />)}
              </div>
            ) : (
              <Card className="flex items-center gap-3 p-5 text-muted-foreground">
                <Clock className="size-5 text-primary" /> {spots.length ? t("park.noTrails") : t("park.notReady")}
              </Card>
            )}
          </section>

          {spots.length > 0 && (
            <section>
              <SectionHeader title={t("park.spots")} href={`/parks/${park.slug}/map`} linkLabel={t("park.openMap")} />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {spots.map((s) => <SpotTile key={s.id} spot={s} parkSlug={park.slug} className="aspect-[4/5]" />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
