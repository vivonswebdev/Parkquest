import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

/** Signale qu'un contenu est une donnée de démonstration (jamais présenté comme officiel). */
export function DemoBadge({ className }: { className?: string }) {
  const t = useTranslations("common");
  return (
    <Pill tone="demo" size="sm" className={className} title={t("demoDataNotice")}>
      <FlaskConical />
      {t("demo")}
    </Pill>
  );
}

export function DemoNotice({ className, kind = "data" }: { className?: string; kind?: "data" | "mode" }) {
  const t = useTranslations("common");
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-gold/25 bg-gold/[0.07] px-3.5 py-2.5 text-xs leading-relaxed text-gold/90",
        className,
      )}
    >
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {kind === "data" ? t("demoDataNotice") : t("demoModeNotice")}
    </p>
  );
}
