"use client";

import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-danger/15 text-danger"><TriangleAlert className="size-8" /></span>
      <h1 className="font-display text-2xl font-extrabold">{t("errorTitle")}</h1>
      <p className="text-muted-foreground">{t("errorBody")}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>{t("retry")}</Button>
        <Button asChild variant="secondary"><Link href="/">{t("goHome")}</Link></Button>
      </div>
    </main>
  );
}
