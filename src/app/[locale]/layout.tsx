import type { Metadata, Viewport } from "next";
import { brand } from "@/config/brand";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fraunces, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { DesktopHeader } from "@/components/layout/desktop-header";
import { NetworkStatus } from "@/components/layout/network-status";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { themeInitScript } from "@/components/theme/theme";
import { ThemeSync } from "@/components/theme/theme-switcher";
import { DemoBadgeToaster, DemoPanel } from "@/features/demo/demo-panel";
import { isDemoMode } from "@/lib/config/app-mode";
import { routing } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-jakarta", display: "swap" });
// Serif éditoriale pour les pages de lecture (blog, infos pratiques, légal).
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-serif", display: "swap", weight: ["600", "700"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: `%s · ${brand.name}` },
    description: t("description"),
    applicationName: brand.name,
    appleWebApp: { capable: true, title: brand.name, statusBarStyle: "black-translucent" },
    icons: { apple: "/icons/apple-touch-icon.png" },
    alternates: { languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = {
  themeColor: "#031711",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    // data-theme* sont posés avant le rendu par themeInitScript (préférence locale) → suppressHydrationWarning.
    <html lang={locale} data-theme="dark" data-theme-pref="default" className={`${inter.variable} ${jakarta.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        {/*
          Compromis Next 16 (voir docs/ARCHITECTURE.md § « Initialisation du thème ») : ce script
          brut s'exécute pendant l'analyse du HTML, AVANT le premier affichage (aucun flash).
          next/script + beforeInteractive supprime l'avertissement React de développement mais
          applique le thème après le premier affichage (flash mesuré). Ne pas remplacer sans solution
          qui garde les deux propriétés.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <NetworkStatus />
          <DesktopHeader />
          {children}
          <BottomNav />
          <ServiceWorkerRegister />
          <ThemeSync />
          {isDemoMode && (
            <>
              <DemoPanel />
              <DemoBadgeToaster />
            </>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
