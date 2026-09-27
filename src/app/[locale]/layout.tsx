import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: "%s · ParkQuest" },
    description: t("description"),
    applicationName: "ParkQuest",
    appleWebApp: { capable: true, title: "ParkQuest", statusBarStyle: "black-translucent" },
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
    <html lang={locale} data-theme="dark" data-theme-pref="default" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
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
