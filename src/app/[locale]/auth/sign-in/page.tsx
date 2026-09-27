import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SignInForm } from "@/components/auth/sign-in-form";
import { LogoMark } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title") };
}

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <main className="topo-bg mx-auto flex min-h-[80dvh] max-w-md flex-col justify-center px-4 pb-32 pt-10">
      <Card className="p-6">
        <LogoMark className="size-12" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-6"><SignInForm /></div>
      </Card>
    </main>
  );
}
