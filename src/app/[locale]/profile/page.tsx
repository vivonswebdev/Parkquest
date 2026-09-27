import { Award, ChevronRight, Heart, Map, MessageSquare, Route, Settings, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LevelLine, StatsGrid } from "@/components/game/progress-dashboard";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoUser } from "@/features/demo/demo-data";
import { Link } from "@/i18n/navigation";
import { FEATURED_PARK_SLUG } from "@/lib/data";
import { isDemoMode } from "@/lib/config/app-mode";
import { getServerProgress } from "@/server/progress";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profile" });
  return { title: t("title") };
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const live = await getServerProgress();
  const name = live?.username || (isDemoMode ? demoUser.displayName : t("home.guest"));

  const sections = [
    { icon: Route, label: t("profile.myTrails"), href: `/parks/${FEATURED_PARK_SLUG}#trails` },
    { icon: Map, label: t("profile.myDiscoveries"), href: `/parks/${FEATURED_PARK_SLUG}/map` },
    { icon: Award, label: t("profile.myBadges"), href: "/challenges" },
    { icon: Heart, label: t("profile.myFavorites"), href: `/parks/${FEATURED_PARK_SLUG}` },
    { icon: MessageSquare, label: t("profile.myContributions"), href: "/community" },
    { icon: ShieldCheck, label: t("profile.privacy"), href: "/legal/privacy" },
  ];

  return (
    <>
      <main className="topo-bg mx-auto max-w-3xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <Card className="p-5 text-center">
          <div className="mx-auto inline-flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-mint to-forest p-1 glow-mint">
            <span className="inline-flex size-full items-center justify-center rounded-full bg-background">
              <UserRound className="size-10 text-primary" />
            </span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-extrabold">{name}</h1>
          <p className="text-sm font-semibold text-primary"><LevelLine live={live} /></p>
          <div className="mt-5">
            <StatsGrid
              live={live}
              labels={{ visits: t("profile.visits"), spots: t("profile.spots"), distance: t("profile.distance"), photos: t("profile.photos"), badges: t("profile.badges") }}
            />
          </div>
        </Card>

        {!live && (
          <Card className="border-gold/30 p-5">
            <p className="font-semibold text-gold">{t("profile.demoProfile")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{!isDemoMode ? t("visit.authRequired") : t("profile.demoProfileBody")}</p>
            <Button asChild className="mt-3" variant="outline"><Link href="/auth/sign-in">{t("profile.signInCta")}</Link></Button>
          </Card>
        )}

        <Card className="divide-y divide-border">
          {sections.map(({ icon: Icon, label, href }) => (
            <Link key={label} href={href} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-primary-soft">
              <Icon className="size-5 text-primary" />
              <span className="flex-1 font-medium">{label}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </Card>

        <Card className="divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Settings className="size-5 text-primary" />
            <span className="flex-1 font-medium">{t("profile.settings")} · {t("common.language")}</span>
            <LocaleSwitcher />
          </div>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <span className="flex-1 font-medium">{t("common.theme")}</span>
            <ThemeSwitcher />
          </div>
        </Card>
        <p className="text-center text-xs text-muted-foreground">{t("profile.privacyBody")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
