import { ArrowRight, Award, Bell, Camera, ChevronRight, Footprints, Map, MapPin, Play, Route, Sparkles, Trophy, Users } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { CollectionProgress } from "@/components/game/collection-progress";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-switcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { ParkCard } from "@/components/park/park-card";
import { SpotTile } from "@/components/park/spot-tile";
import { TrailCard } from "@/components/park/trail-card";
import { DemoBadge, DemoNotice } from "@/components/shared/demo-badge";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card, GlassCard } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { demoUser } from "@/features/demo/demo-data";
import { isDemoMode } from "@/lib/config/app-mode";
import { Link } from "@/i18n/navigation";
import { FEATURED_PARK_SLUG, getPark, listSpots, listTrails, repo } from "@/lib/data";
import { distanceM, walkingMinutes } from "@/lib/geo";
import { formatDistance } from "@/lib/format";
import { getServerProgress } from "@/server/progress";
import { WeatherCard } from "@/components/weather/weather-card";
import { getVisitWeather } from "@/lib/weather";


// Météo : page régénérée au plus toutes les 30 minutes.
export const revalidate = 1800;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const loc = await getLocale();

  const park = await getPark(FEATURED_PARK_SLUG, loc);
  if (!park) notFound();
  const [trails, spots, challenges, parks, progress, weather] = await Promise.all([
    listTrails(park.id, loc),
    listSpots(park.id, loc),
    repo.listChallenges(park.id, loc),
    repo.listParks(loc),
    getServerProgress(),
    getVisitWeather(park.location, park.timezone, 120),
  ]);
  const mainTrail = trails[0];
  const entrance = mainTrail ? (await repo.getTrail(park.id, mainTrail.slug, loc))?.start : park.location;
  const nearby = [...spots]
    .map((s) => ({ s, d: entrance ? distanceM(entrance, s.location) : 0 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);
  const otherParks = parks.filter((p) => p.id !== park.id);
  const name = progress?.username || (isDemoMode ? demoUser.displayName : t("home.guest"));

  return (
    <>
      <main className="topo-bg mx-auto max-w-7xl px-4 pb-32 pt-[max(env(safe-area-inset-top),1rem)] md:px-6 md:pb-16 md:pt-8">
        {/* En-tête mobile */}
        <div className="mb-6 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <LogoMark className="size-11" />
            <div className="leading-tight">
              <p className="text-sm text-muted-foreground">{t("home.greeting")}</p>
              <p className="font-display text-lg font-bold">{name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
            <Link href="/challenges" aria-label={t("nav.challenges")} className="glass inline-flex size-11 items-center justify-center rounded-full">
              <Bell className="size-5" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10">
          <section>
            <h1 className="font-display text-[44px] font-extrabold uppercase leading-[0.95] tracking-tight md:text-7xl">
              {t("home.heroLine1")}
              <br />
              <span className="text-primary">{t("home.heroLine2")}</span>
              <br />
              {t("home.heroLine3")}
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground md:text-lg">{t("home.heroSubtitle")}</p>
            <div className="mt-6 hidden gap-3 lg:flex">
              {mainTrail && (
                <Button asChild size="lg">
                  <Link href={`/parks/${park.slug}/trails/${mainTrail.slug}/visit`}>
                    <Play className="fill-current" /> {t("common.startVisit")}
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="secondary">
                <Link href={`/parks/${park.slug}#trails`}>{t("common.exploreTrails")}</Link>
              </Button>
            </div>
          </section>

          {/* Carte immersive du parc sélectionné */}
          <section aria-label={t("home.selectedPark")} className="relative overflow-hidden rounded-[28px] border border-border card-shadow">
            <div className="absolute inset-0">
              <Image src={park.coverImageUrl} alt="" fill priority sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/10 to-background/90" />
            </div>
            <div className="relative p-5 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <span className="size-2.5 rounded-full bg-primary shadow-[0_0_12px_var(--pq-mint)]" />
                    {t("home.selectedPark")}
                  </p>
                  <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight md:text-4xl">{park.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" /> {park.city}, {park.countryCode}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {park.isDemoData && <DemoBadge />}
                  <Link href={`/parks/${park.slug}/map`} aria-label={t("park.openMap")} className="inline-flex size-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:text-primary">
                    <Map className="size-5" />
                  </Link>
                </div>
              </div>

              <div className="mt-24 grid grid-cols-3 gap-2 md:mt-32">
                {[
                  { icon: MapPin, value: park.spotCount, label: t("home.statSpots") },
                  { icon: Route, value: park.trailCount, label: t("home.statTrails") },
                  { icon: Award, value: park.badgeCount, label: t("home.statBadges") },
                ].map(({ icon: Icon, value, label }) => (
                  <GlassCard key={label} className="rounded-2xl p-3">
                    <Icon className="size-4 text-primary" />
                    <p className="mt-1.5 font-display text-2xl font-extrabold leading-none">{value}</p>
                    <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
                  </GlassCard>
                ))}
              </div>

              <GlassCard className="mt-2 rounded-2xl p-3.5">
                <CollectionProgress parkName={park.name} spotIds={spots.map((s) => s.id)} serverDiscovered={progress?.discoveredSpotIds} compact />
              </GlassCard>

              {mainTrail && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row lg:hidden">
                  <Button asChild size="lg" block>
                    <Link href={`/parks/${park.slug}/trails/${mainTrail.slug}/visit`}>
                      <Play className="fill-current" /> {t("common.startVisit")}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" block>
                    <Link href={`/parks/${park.slug}#trails`}>{t("common.exploreTrails")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>

        {park.isDemoData && <DemoNotice className="mt-4" />}

        <WeatherCard weather={weather} className="mt-4" />

        {/* Parcours populaires */}
        <section className="mt-10">
          <SectionHeader title={t("home.popularTrails")} href={`/parks/${park.slug}#trails`} linkLabel={t("common.seeAll")} />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trails.map((tr, i) => (
              <TrailCard key={tr.id} trail={tr} parkSlug={park.slug} priority={i === 0} />
            ))}
            <Link href={`/parks/${park.slug}/plan`} className="group flex flex-col justify-between rounded-[var(--radius-card)] border border-dashed border-primary/30 bg-primary-soft p-5 transition-colors hover:border-primary/60">
              <Sparkles className="size-6 text-primary" />
              <div>
                <p className="mt-6 font-display text-lg font-bold">{t("home.planVisit")}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t("home.planVisitBody")}</p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {t("plan.recommend")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        {/* Spots près de l'entrée */}
        <section className="mt-10">
          <SectionHeader title={t("home.recentDiscoveries")} href={`/parks/${park.slug}/map`} linkLabel={t("common.seeAll")} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {nearby.map(({ s, d }) => (
              <SpotTile key={s.id} spot={s} parkSlug={park.slug} className="aspect-[4/5]" meta={`${formatDistance(d, loc)} · ${walkingMinutes(d)} min`} />
            ))}
          </div>
        </section>

        {/* Défis du jour + mission famille */}
        <section className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-5">
            <SectionHeader title={t("home.dailyChallenges")} href="/challenges" linkLabel={t("common.seeAll")} icon={<Trophy className="size-5 text-gold" />} />
            <ul className="divide-y divide-border">
              {challenges.slice(0, 4).map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    {c.type === "PHOTO" ? <Camera className="size-5" /> : c.type === "WALK" ? <Footprints className="size-5" /> : <Sparkles className="size-5" />}
                  </span>
                  <p className="flex-1 text-sm font-medium">{c.title}</p>
                  <Pill tone="gold" size="sm">+{c.pointsValue}</Pill>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="relative overflow-hidden p-5">
            <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/15 blur-2xl" />
            <Users className="size-6 text-primary" />
            <h3 className="mt-3 text-lg font-bold">{t("home.familyMission")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("home.familyMissionBody")}</p>
            {mainTrail && (
              <Button asChild variant="outline" className="mt-4">
                <Link href={`/parks/${park.slug}/trails/${mainTrail.slug}`}>
                  {t("home.familyMissionCta")} <ChevronRight />
                </Link>
              </Button>
            )}
          </Card>
        </section>

        {/* Autres parcs */}
        <section className="mt-10">
          <SectionHeader title={t("home.nearbyParks")} href="/parks" linkLabel={t("common.seeAll")} />
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {otherParks.map((p) => (
              <ParkCard key={p.id} park={p} className="w-[78%] shrink-0 snap-start md:w-auto" />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
