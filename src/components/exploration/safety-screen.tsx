"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const LINES = ["l1", "l2", "l3", "l4", "l5"] as const;

/**
 * Écran de sécurité avant chaque aventure (texte validé par le porteur du projet).
 * Le bouton reste désactivé tant que la case n'est pas cochée. Ce n'est pas une clause
 * juridique : seulement des consignes comprises par le joueur.
 */
export function SafetyScreen({ backHref, onStart }: { backHref: string; onStart(): void }) {
  const t = useTranslations("explore.safety");
  const app = useTranslations("common")("appName");
  const [accepted, setAccepted] = useState(false);
  const titleId = useId();
  return (
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="absolute inset-0 z-40 flex items-end justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:items-center">
      <div className="glass-strong w-full max-w-md rounded-[var(--radius-sheet)] p-5 card-shadow safe-bottom">
        <p id={titleId} className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <ShieldCheck className="size-7 text-primary" aria-hidden /> {t("title")}
        </p>
        <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed">
          {LINES.map((k) => (
            <li key={k} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {t(k, { app })}
            </li>
          ))}
        </ul>
        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl bg-inset p-3.5 font-semibold">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="size-5 shrink-0 accent-[var(--primary)]" />
          {t("accept")}
        </label>
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
          <Button asChild variant="secondary" size="lg">
            <Link href={backHref}>{t("back")}</Link>
          </Button>
          <Button size="lg" disabled={!accepted} onClick={onStart}>
            {t("start")}
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">{t("parkRules", { app })}</p>
      </div>
    </div>
  );
}
