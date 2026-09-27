import { BarChart3, FileText, HelpCircle, Image as ImageIcon, Info, Map, MapPin, MessageSquare, Route, Store, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DemoBadge } from "@/components/shared/demo-badge";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";
import { FEATURED_PARK_SLUG, listSpots, listTrails, repo } from "@/lib/data";
import { requirePark } from "@/lib/data/loaders";
import { isDemoMode } from "@/lib/config/app-mode";
import { getCurrentUser } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("title"), robots: { index: false } };
}

/**
 * Espace admin — Sprint 2. Aperçu en lecture seule en mode démo.
 * En mode Supabase, l'accès réel est contrôlé par la RLS (rôles PARK_ADMIN / EDITOR / MODERATOR).
 */
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const user = !isDemoMode ? await getCurrentUser() : null;
  if (!isDemoMode && !user) {
    return <main className="mx-auto max-w-xl px-4 py-24 text-center text-muted-foreground">{t("admin.restricted")}</main>;
  }
  const park = await requirePark(FEATURED_PARK_SLUG, locale);
  const [spots, trails, facilities, challenges, articles] = await Promise.all([
    listSpots(park.id, locale),
    listTrails(park.id, locale),
    repo.listFacilities(park.id, locale),
    repo.listChallenges(park.id, locale),
    repo.listArticles(locale),
  ]);
  const sections = [
    { key: "info", icon: Info, count: 1 },
    { key: "map", icon: Map, count: null },
    { key: "spots", icon: MapPin, count: spots.length },
    { key: "trails", icon: Route, count: trails.length },
    { key: "quizzes", icon: HelpCircle, count: null },
    { key: "challenges", icon: Trophy, count: challenges.length },
    { key: "services", icon: Store, count: facilities.length },
    { key: "articles", icon: FileText, count: articles.length },
    { key: "photos", icon: ImageIcon, count: 0 },
    { key: "comments", icon: MessageSquare, count: 0 },
    { key: "users", icon: Users, count: null },
    { key: "analytics", icon: BarChart3, count: null },
  ] as const;

  return (
    <div className="reading-light min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-6xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold">{t("admin.title")}</h1>
            <p className="text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
          {isDemoMode && <Pill tone="muted">{t("admin.demoReadOnly")}</Pill>}
        </header>
        <Card className="p-5 shadow-none">
          <p className="text-sm text-muted-foreground">{t("admin.myPark")}</p>
          <p className="flex items-center gap-2 text-xl font-bold">{park.name} {park.isDemoData && <DemoBadge />}</p>
        </Card>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {sections.map(({ key, icon: Icon, count }) => (
            <Card key={key} className="p-4 shadow-none">
              <Icon className="size-5 text-primary" />
              <p className="mt-2 font-semibold">{t(`admin.sections.${key}`)}</p>
              <p className="text-xs text-muted-foreground">{count === null ? t("common.comingSoon") : t("admin.count", { count })}</p>
            </Card>
          ))}
        </div>
        <Card className="overflow-x-auto p-0 shadow-none">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr><th className="px-4 py-3">{t("admin.sections.spots")}</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Lat, Lng</th><th className="px-4 py-3">{t("admin.toValidate")}</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {spots.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{t(`spotKind.${s.kind}`)}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{s.location.lat.toFixed(5)}, {s.location.lng.toFixed(5)}</td>
                  <td className="px-4 py-3">{s.isDemoData ? <DemoBadge /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </main>
    </div>
  );
}
