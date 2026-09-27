import { MapPinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("common");
  return (
    <main className="topo-bg mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary"><MapPinOff className="size-8" /></span>
      <h1 className="font-display text-2xl font-extrabold">{t("notFoundTitle")}</h1>
      <p className="text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild><Link href="/">{t("goHome")}</Link></Button>
    </main>
  );
}
