"use client";

import { AlertTriangle, Award, FlaskConical, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ActionError, ActionMode } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

/** Points gagnés (ou rien si 0). Sobre, respecte prefers-reduced-motion via CSS globale. */
export function PointsBurst({ points, badges = [] }: { points: number; badges?: string[] }) {
  const t = useTranslations("common");
  if (points <= 0 && badges.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95 duration-300">
      {points > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3.5 py-2 font-display text-base font-extrabold text-gold">
          <Sparkles className="size-4" />
          {t("pointsGain", { count: points })}
        </span>
      )}
      {badges.map((b) => (
        <span key={b} className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-2 text-sm font-semibold text-primary">
          <Award className="size-4" /> <span className="capitalize">{b.replace(/-/g, " ")}</span>
        </span>
      ))}
    </div>
  );
}

/** En mode démo, rappelle que rien n'est enregistré côté serveur. */
export function ModeNotice({ mode }: { mode: ActionMode }) {
  const t = useTranslations("common");
  if (mode !== "demo") return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-gold/80">
      <FlaskConical className="size-3.5" /> {t("demoModeNotice")}
    </p>
  );
}

export function ActionErrorMessage({ error, className }: { error: ActionError; className?: string }) {
  const t = useTranslations();
  const msg =
    error === "AUTH_REQUIRED"
      ? t("visit.authRequired")
      : error === "OFFLINE"
        ? t("offline.body")
        : error === "PHOTO_REQUIRED"
          ? t("challenge.photoRequired")
          : error === "NOT_FOUND"
            ? t("common.notFoundBody")
            : t("common.errorBody");
  return (
    <div role="alert" className={cn("flex items-start gap-2 rounded-2xl bg-danger/10 p-3 text-sm text-danger", className)}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>
        {msg}{" "}
        {error === "AUTH_REQUIRED" && (
          <Link href="/auth/sign-in" className="font-semibold underline">
            {t("common.signIn")}
          </Link>
        )}
      </span>
    </div>
  );
}
