import { Camera, Flag, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card } from "@/components/ui/card";
import { Pill } from "@/components/ui/pill";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "community" });
  return { title: t("title") };
}

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const principles = [
    { icon: UserRound, text: t("community.p1") },
    { icon: ShieldCheck, text: t("community.p2") },
    { icon: Flag, text: t("community.p3") },
  ];
  return (
    <>
      <main className="topo-bg mx-auto max-w-3xl space-y-6 px-4 pb-32 pt-[max(env(safe-area-inset-top),1.25rem)] md:px-6 md:pt-10">
        <Pill tone="muted">{t("common.comingSoon")}</Pill>
        <h1 className="font-display text-3xl font-extrabold md:text-5xl">{t("community.title")}</h1>
        <p className="text-lg text-muted-foreground">{t("community.subtitle")}</p>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-bold"><Camera className="size-5 text-primary" /> {t("community.principles")}</h2>
          <ul className="mt-4 space-y-3">
            {principles.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3"><Icon className="mt-0.5 size-5 shrink-0 text-primary" /> {text}</li>
            ))}
          </ul>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
