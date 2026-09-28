import { Accessibility, ArrowLeft, Award, Clock, Gauge, Map as MapIcon, MapPin, Play, Route, Users } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { SPOT_KIND_COLOR, SPOT_KIND_ICON } from "@/components/shared/icons";
import { DemoBadge, DemoNotice } from "@/components/shared/demo-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { getPark, repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { formatDistance, formatDuration } from "@/lib/format";
import { pathLengthM, walkingMinutes } from "@/lib/geo";
import { WeatherCard } from "@/components/weather/weather-card";
import { getVisitWeather } from "@/lib/weather";
import { getServerProgress } from "@/server/progress";
import { TrailProgressCard } from "@/components/trail/trail-progress-card";

type Params = { params: Promise<{ locale: string; parkSlug: string; trailSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, parkSlug, trailSlug } = await params;
  const park = await getPark(parkSlug, locale);
  const trail = park ? await repo.getTrail(park.id, trailSlug, locale) : null;
  return trail ? { title: trail.name, description: trail.summary } : {};
}

// Météo : page régénérée au plus toutes les 30 minutes.
export const revalidate = 1800;

export default async function TrailPage({ params }: Params) {
  const { locale, parkSlug, trailSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const park = await requirePark(parkSlug, locale);
  const trail = await repo.getTrail(park.id, trailSlug, locale);
  if (!trail) notFound();
  const [weather, progress] = await Promise.all([getVisitWeather(park.location, park.timezone, trail.durationMin), getServerProgress()]);

  const stats = [
    { icon: Clock, label: t("trail.duration"), value: formatDuration(trail.durationMin) },
    { icon: Route, label: t("trail.distance"), value: formatDistance(trail.distanceM, locale) },
    { icon: Gauge, label: t("trail.level"), value: t(`trail.difficulty.${trail.difficulty}`) },
    { icon: Award, label: t("trail.points"), value: `+${trail.completionPoints + trail.spots.reduce((a, s) => a + s.pointsValue, 0)}` },
  ];

  return (
    <>
      <main className="pb-52 md:pb-16">
        <div className="relative h-[34vh] min-h-[250px] md:h-[380px]">
          <Image src={trail.coverImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)]">
            <Link href={`/parks/${park.slug}`} aria-label={t("common.back")} className="inline-flex size-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
              <ArrowLeft className="size-5" />
            </Link>
            {trail.isDemoData && <DemoBadge />}
          </div>
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-4 pb-5 md:px-6">
            <p className="text-sm font-semibold text-primary">{park.name}</p>
            <h1 className="light-serif mt-1 font-display text-3xl font-extrabold leading-tight md:text-5xl">{trail.name}</h1>
          </div>
        </div>

        <div className="mx-auto max-w-5xl space-y-6 px-4 pt-4 md:px-6">
          {/* Chiffres clés sur une ligne */}
          <dl className="grid grid-cols-4 divide-x divide-border rounded-[var(--radius-card)] border border-border bg-surface py-3 card-shadow">
            {stats.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex min-w-0 flex-col items-center gap-0.5 px-1 text-center">
                <Icon className="size-4 text-primary" aria-hidden />
                <dd className="truncate font-display text-base font-bold leading-tight">{value}</dd>
                <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>

          <TrailProgressCard
            trailName={trail.name}
            spots={trail.spots.map((sp) => ({ id: sp.id, pointsValue: sp.pointsValue }))}
            segments={trail.segments.map((g) => ({ toSpotId: g.toSpotId, path: g.path }))}
            completionPoints={trail.completionPoints}
            serverDiscovered={progress?.discoveredSpotIds ?? null}
          />

          <div className="hidden gap-3 md:flex">
            <Button asChild size="lg">
              <Link href={`/parks/${park.slug}/trails/${trail.slug}/visit`}>
                <Play className="fill-current" /> {t("common.startVisit")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={`/parks/${park.slug}/map`}>
                <MapIcon /> {t("park.openMap")}
              </Link>
            </Button>
          </div>

          <Card className="space-y-3 p-5">
            <h2 className="light-serif text-xl font-bold">{t("trail.overview")}</h2>
            <p className="leading-relaxed text-muted-foreground">{trail.description ?? trail.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="muted"><Users />{trail.audiences.map((a) => t(`trail.audience.${a}`)).join(" · ")}</Pill>
              {trail.themes.map((th) => <Pill key={th}>{t(`trail.theme.${th}`)}</Pill>)}
              {(trail.isPmrAccessible || trail.pmrPartial) && (
                <Pill tone="gold"><Accessibility />{trail.isPmrAccessible ? t("common.pmr") : t("common.pmrPartial")}</Pill>
              )}
            </div>
            {trail.accessibilityNotes && <p className="text-sm text-muted-foreground">{trail.accessibilityNotes}</p>}
          </Card>

          <section>
            <h2 className="light-serif mb-3 text-xl font-bold">{t("trail.stops")}</h2>
            <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-primary/10">
              <li className="relative flex items-center gap-4 pl-1">
                <span className="z-10 inline-flex size-12 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"><MapPin className="size-5" /></span>
                <span className="font-semibold">{t("visit.start")}</span>
              </li>
              {trail.spots.map((s, i) => {
                const Icon = SPOT_KIND_ICON[s.kind];
                const seg = trail.segments.find((g) => g.toSpotId === s.id);
                const d = seg ? pathLengthM(seg.path) : 0;
                return (
                  <li key={s.id}>
                    <Link href={`/parks/${park.slug}/spots/${s.slug}`} className="relative flex items-center gap-4 rounded-[var(--radius-card)] pl-1 pr-3 hover:bg-primary-soft">
                      <span className="relative z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-background" style={{ borderColor: SPOT_KIND_COLOR[s.kind], color: SPOT_KIND_COLOR[s.kind] }}>
                        <Icon className="size-5" />
                        <span aria-hidden className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-foreground font-display text-[11px] font-extrabold text-background">
                          {i + 1}
                        </span>
                      </span>
                      <span className="relative my-1 size-16 shrink-0 overflow-hidden rounded-2xl">
                        <Image src={s.coverImageUrl} alt="" fill sizes="64px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1 py-2">
                        <span className="text-xs text-muted-foreground">{i + 1}. {formatDistance(d, locale)} · {walkingMinutes(d)} min</span>
                        <span className="block truncate font-semibold">{s.name}</span>
                        {s.label && <span className="block truncate text-xs text-muted-foreground">{s.label}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>

          <WeatherCard weather={weather} />

          {trail.isDemoData && <DemoNotice />}
        </div>

        {/* Mobile : départ toujours accessible, juste au-dessus de la navigation */}
        <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-30 px-4 md:hidden">
          <div className="glass-strong flex items-center gap-2 rounded-[22px] p-2 card-shadow">
            <Button asChild size="lg" block>
              <Link href={`/parks/${park.slug}/trails/${trail.slug}/visit`}>
                <Play className="fill-current" /> {t("common.startVisit")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="w-14 shrink-0 px-0" aria-label={t("park.openMap")}>
              <Link href={`/parks/${park.slug}/map`}>
                <MapIcon />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
