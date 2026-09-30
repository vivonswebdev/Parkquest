import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("explore");
  return (
    <div role="status" className="fixed inset-0 z-[44] flex flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p>{t("loading")}</p>
    </div>
  );
}
