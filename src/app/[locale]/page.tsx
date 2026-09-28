import { ArrowRight, Bell, Camera, ChevronRight, Footprints, Map, MapPin, Play, Route, Sparkles, Trophy, Users } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { demoUser } from "@/features/demo/demo-data";
import { isDemoMode } from "@/lib/config/app-mode";
import type { Challenge } from "@/lib/domain/types";
import { pickDaily } from "@/lib/daily";
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
  // Défi du jour : rotation déterministe selon la date (même défi pour tous ce jour-là).
  const daily = pickDaily(challenges);
  const dailySpot = daily?.spotId ? spots.find((s) => s.id === daily.spotId) : undefined;
  const otherChallenges = challenges.filter((c) => c.id !== daily?.id).slice(0, 3);
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

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-10">
          <section>
            <h1 className="light-serif font-display text-[34px] font-extrabold uppercase leading-[0.98] tracking-tight md:text-7xl">
              {t("home.heroLine1")} <span className="text-primary">{t("home.heroLine2")}</span>
              <br className="hidden md:block" /> {t("home.heroLine3")}
            </h1>
            <p className="mt-2 max-w-md text-[15px] text-muted-foreground md:mt-4 md:text-lg">{t("home.heroSubtitle")}</p>
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

          {/* Parc sélectionné : tout l'essentiel (collection + départ) dans le premier écran */}
          <section aria-label={t("home.selectedPark")} className="overflow-hidden rounded-[28px] border border-border bg-surface card-shadow">
            <div className="relative h-44 md:h-64">
              <Image src={park.coverImageUrl} alt="" fill priority sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
              <div className="image-scrim absolute inset-0" />
              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <span className="size-2 rounded-full bg-[var(--pq-mint)] shadow-[0_0_10px_var(--pq-mint)]" />
                  {t("home.selectedPark")}
                </span>
                <div className="flex items-center gap-2">
                  {park.isDemoData && <DemoBadge className="border-transparent bg-black/55 text-[#f4c95d] backdrop-blur" />}
                  <Link href={`/parks/${park.slug}/map`} aria-label={t("park.openMap")} className="inline-flex size-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:text-[var(--pq-mint)]">
                    <Map className="size-5" />
                  </Link>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <Link href={`/parks/${park.slug}`} className="group inline-flex items-center gap-1">
                  <h2 className="light-serif font-display text-[28px] font-extrabold leading-tight md:text-4xl">{park.name}</h2>
                  <ChevronRight className="size-5 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <p className="flex flex-wrap items-center gap-x-2 text-sm text-white/80">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {park.city}, {park.countryCode}
                  </span>
                  <span aria-hidden>·</span>
                  <span>{t("home.parkStats", { spots: park.spotCount, trails: park.trailCount, badges: park.badgeCount })}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <CollectionProgress parkName={park.name} spotIds={spots.map((s) => s.id)} serverDiscovered={progress?.discoveredSpotIds} compact />
              {mainTrail && (
                <div className="grid grid-cols-[1fr_auto] gap-2 lg:hidden">
                  <Button asChild size="lg" block>
                    <Link href={`/parks/${park.slug}/trails/${mainTrail.slug}/visit`}>
                      <Play className="fill-current" /> {t("common.startVisit")}
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="px-4">
                    <Link href={`/parks/${park.slug}#trails`}>
                      <Route /> <span className="sr-only sm:not-sr-only">{t("common.exploreTrails")}</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* Défi du jour : un seul défi mis en avant (change chaque jour) */}
          {daily && (
            <Link
              href={dailySpot ? `/parks/${park.slug}/spots/${dailySpot.slug}` : "/challenges"}
              className="group flex items-center gap-3 rounded-[var(--radius-card)] border border-gold/30 bg-gold/10 p-4 transition-colors hover:border-gold/60"
            >
              <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gold text-[#1a2e24]">
                <ChallengeIcon type={daily.type} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-gold">{t("home.dailyChallenge")}</span>
                <span className="block font-semibold leading-snug">{daily.title}</span>
                {dailySpot && <span className="block truncate text-xs text-muted-foreground">{dailySpot.name}</span>}
              </span>
              <span className="flex shrink-0 flex-col items-end gap-1">
                <Pill tone="gold" size="sm">+{daily.pointsValue}</Pill>
                <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )}
          <WeatherCard weather={weather} />
        </div>

        {park.isDemoData && <DemoNotice className="mt-4" />}

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
            <SectionHeader title={t("home.otherChallenges")} href="/challenges" linkLabel={t("common.seeAll")} icon={<Trophy className="size-5 text-gold" />} />
            <ul className="divide-y divide-border">
              {otherChallenges.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                    <ChallengeIcon type={c.type} />
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

function ChallengeIcon({ type }: { type: Challenge["type"] }) {
  return type === "PHOTO" ? <Camera className="size-5" /> : type === "WALK" ? <Footprints className="size-5" /> : <Sparkles className="size-5" />;
}
