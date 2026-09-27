import { WifiOff } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function OfflinePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <main className="topo-bg mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="inline-flex size-20 items-center justify-center rounded-full bg-gold/15 text-gold"><WifiOff className="size-9" /></span>
      <h1 className="font-display text-2xl font-extrabold">{t("offline.title")}</h1>
      <p className="text-muted-foreground">{t("offline.body")}</p>
      <Button asChild><Link href="/">{t("common.goHome")}</Link></Button>
    </main>
  );
}
