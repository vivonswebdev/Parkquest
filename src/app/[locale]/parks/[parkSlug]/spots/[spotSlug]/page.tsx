import { Accessibility, ArrowLeft, Calendar, Camera, Footprints, Globe2, Lightbulb, MapPin, MessageCircle, Navigation, Ruler, Sprout, TreeDeciduous } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChallengeCard } from "@/components/game/challenge-card";
import { DiscoverSpotCard } from "@/components/game/discover-spot-card";
import { FavoriteButton } from "@/components/game/favorite-button";
import { QuizCard } from "@/components/game/quiz-card";
import { SiteFooter } from "@/components/layout/site-footer";
import { DemoBadge, DemoNotice } from "@/components/shared/demo-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { Link } from "@/i18n/navigation";
import { getPark, listTrails, repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { formatDistance, formatNumber } from "@/lib/format";
import { distanceM, walkingMinutes } from "@/lib/geo";
import { getServerProgress } from "@/server/progress";

type Params = { params: Promise<{ locale: string; parkSlug: string; spotSlug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, parkSlug, spotSlug } = await params;
  const park = await getPark(parkSlug, locale);
  const spot = park ? await repo.getSpot(park.id, spotSlug, locale) : null;
  return spot ? { title: spot.name, description: spot.summary } : {};
}

export default async function SpotPage({ params }: Params) {
  const { locale, parkSlug, spotSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const park = await requirePark(parkSlug, locale);
  const spot = await repo.getSpot(park.id, spotSlug, locale);
  if (!spot) notFound();

  const [quizzes, challenges, facilities, trails, progress] = await Promise.all([
    repo.listQuizzesForSpot(spot.id, locale),
    repo.listChallenges(park.id, locale, spot.id),
    repo.listFacilities(park.id, locale),
    listTrails(park.id, locale),
    getServerProgress(),
  ]);
  const entrance = facilities.find((f) => f.type === "ENTRANCE")?.location ?? park.location;
  const fromEntrance = distanceM(entrance, spot.location);
  const trail = trails[0] ? await repo.getTrail(park.id, trails[0].slug, locale) : null;
  const inTrail = trail?.spots.some((s) => s.id === spot.id) ? trail : null;

  const facts = [
    spot.origin || spot.facts.originKey ? { icon: Globe2, label: t("spot.origin"), value: spot.origin ?? t(`origin.${spot.facts.originKey}` as "origin.europe") } : null,
    spot.facts.plantedYear ? { icon: Sprout, label: t("spot.planted"), value: String(spot.facts.plantedYear) } : null,
    spot.facts.heightM ? { icon: TreeDeciduous, label: t("spot.height"), value: `${formatNumber(spot.facts.heightM, locale)} m` } : null,
    spot.facts.girthM ? { icon: Ruler, label: t("spot.girth"), value: `${formatNumber(spot.facts.girthM, locale, 1)} m` } : null,
    spot.facts.bloomMonths?.length
      ? {
          icon: Calendar,
          label: t("spot.bloom"),
          value: spot.facts.bloomMonths.map((m) => new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(2026, m - 1, 1))).join(" – "),
        }
      : null,
    spot.facts.builtYear ? { icon: Calendar, label: t("spot.built"), value: String(spot.facts.builtYear) } : null,
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <>
      <main className="pb-32 md:pb-16">
        {/* Photo immersive */}
        <div className="relative mx-auto max-w-5xl md:px-6 md:pt-6">
          <div className="relative h-[46vh] min-h-[320px] overflow-hidden md:h-[420px] md:rounded-[28px]">
            <Image src={spot.coverImageUrl} alt="" fill priority sizes="(max-width: 1024px) 100vw, 1000px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/30" />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)]">
              <Link href={`/parks/${park.slug}/map`} aria-label={t("common.back")} className="inline-flex size-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
                <ArrowLeft className="size-5" />
              </Link>
              {spot.isDemoData && <DemoBadge />}
            </div>
          </div>
        </div>

        <div className="relative mx-auto -mt-20 max-w-5xl space-y-5 px-4 md:px-6">
          <header>
            <div className="flex flex-wrap gap-1.5">
              {spot.label && <Pill>{spot.label}</Pill>}
              <Pill tone="muted">{t(`spotKind.${spot.kind}`)}</Pill>
              {spot.isPmrAccessible && <Pill tone="muted"><Accessibility />{t("common.pmr")}</Pill>}
            </div>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight md:text-5xl">{spot.name}</h1>
            {spot.scientificName && <p className="mt-1 text-lg italic text-muted-foreground">{spot.scientificName}</p>}
            {spot.contentLocale !== locale && <p className="mt-2 text-xs text-muted-foreground/80">{t("common.contentFallback", { locale: spot.contentLocale.toUpperCase() })}</p>}
            <div className="mt-4 flex gap-2">
              <Button asChild size="lg" className="flex-1 sm:flex-none">
                <Link href={inTrail ? `/parks/${park.slug}/trails/${inTrail.slug}/visit?spot=${spot.slug}` : `/parks/${park.slug}/map`}>
                  <Navigation /> {t("spot.guideMe")}
                </Link>
              </Button>
              <FavoriteButton targetId={spot.id} />
            </div>
          </header>

          {facts.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {facts.map(({ icon: Icon, label, value }) => (
                <Card key={label} className="p-3.5">
                  <Icon className="size-5 text-primary" />
                  <p className="mt-2 text-xs text-muted-foreground">{label}</p>
                  <p className="font-display text-lg font-bold leading-tight">{value}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Découverte (validation serveur, jamais automatique) */}
          <DiscoverSpotCard
            spotId={spot.id}
            spotLocation={spot.location}
            radiusM={spot.discoveryRadiusM}
            serverDiscovered={progress?.discoveredSpotIds.includes(spot.id)}
          />

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              {spot.about && (
                <Card className="p-5">
                  <h2 className="text-xl font-bold">{t("spot.about")}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{spot.about}</p>
                </Card>
              )}
              {spot.funFact && (
                <div className="rounded-[var(--radius-card)] border border-gold/30 bg-gold/[0.08] p-5">
                  <h2 className="flex items-center gap-2 font-bold text-gold"><Lightbulb className="size-5" /> {t("spot.funFact")}</h2>
                  <p className="mt-1.5 leading-relaxed">{spot.funFact}</p>
                </div>
              )}
              <Card className="p-5">
                <h2 className="text-xl font-bold">{t("spot.howToGetThere")}</h2>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-primary" />{formatDistance(fromEntrance, locale)} {t("spot.fromEntrance")}</span>
                  <span className="inline-flex items-center gap-1.5"><Footprints className="size-4 text-primary" />{walkingMinutes(fromEntrance)} min {t("spot.onFoot")}</span>
                </div>
                {spot.directions && <p className="mt-3 text-muted-foreground">{spot.directions}</p>}
                {inTrail && (
                  <p className="mt-3 text-sm">
                    {t("spot.partOfTrail")} :{" "}
                    <Link href={`/parks/${park.slug}/trails/${inTrail.slug}`} className="font-semibold text-primary hover:underline">{inTrail.name}</Link>
                  </p>
                )}
              </Card>
            </div>

            <div className="space-y-5">
              {quizzes.length > 0 && (
                <Card className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{t("spot.quiz")}</p>
                  <QuizCard quizzes={quizzes} />
                </Card>
              )}
              {challenges.map((c) => (
                <Card key={c.id} className="p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{t("spot.challenge")}</p>
                  <ChallengeCard challenge={c} parkId={park.id} />
                </Card>
              ))}
              <Card className="p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold"><Camera className="size-5 text-primary" /> {t("spot.photos")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("spot.noPhotos")}</p>
              </Card>
              <Card className="p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold"><MessageCircle className="size-5 text-primary" /> {t("spot.comments")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("spot.noComments")}</p>
              </Card>
            </div>
          </div>

          {spot.isDemoData && <DemoNotice />}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
