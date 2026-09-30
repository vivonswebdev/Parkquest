"use client";

import { Compass, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useGameState } from "@/features/game/demo-game-state";
import { Link } from "@/i18n/navigation";
import { COLLECTION_SIZE, eggCard } from "@/lib/game-core/eggs";
import { ELEMENTS } from "@/lib/game-core/elements";
import { cn } from "@/lib/utils";
import { ElementEmblem } from "./element-emblem";
import { GameEgg } from "./game-egg";

const card = "rounded-[var(--radius-card)] border border-border bg-surface p-4 card-shadow";
const eyebrow = "text-[11px] font-bold uppercase tracking-[0.14em] text-primary";

/** Carte « Mon œuf actif » : l'estimation est donnée en découvertes, jamais en kilomètres. */
export function ActiveEggCard() {
  const t = useTranslations("game");
  const state = useGameState();
  const c = eggCard(state);
  return (
    <section aria-labelledby="egg-title" className={cn(card, "p-5")}>
      <p id="egg-title" className={eyebrow}>
        {t("activeEgg")}
      </p>
      {c.status === "active" || c.status === "ready" ? (
        <div className="mt-3 flex items-center gap-4">
          <GameEgg theme={c.egg.theme} className="h-28 shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-extrabold leading-tight">{t(`eggNames.${c.egg.theme}`)}</h2>
            {c.status === "active" ? (
              <>
                <p className="mt-1 text-sm font-semibold tabular-nums">{t("energy", { value: c.egg.energy, max: c.egg.required })}</p>
                <div
                  role="progressbar"
                  aria-label={t("energyLabel")}
                  aria-valuemin={0}
                  aria-valuemax={c.egg.required}
                  aria-valuenow={c.egg.energy}
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-inset"
                >
                  <div className="h-full rounded-full bg-primary" style={{ width: `${c.percent}%` }} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t("discoveriesLeft", { count: c.discoveries })}</p>
              </>
            ) : (
              <p className="mt-1 text-sm">
                <span className="font-semibold text-primary">{t("readyTitle")}</span> {t("readyBody")}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <h2 className="font-display text-xl font-extrabold">
            {c.status === "first" ? t("firstTitle") : c.status === "choose" ? t("chooseTitle") : t("noneTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.status === "first" ? t("firstBody") : t("noneBody")}</p>
        </div>
      )}
      <Button asChild size="lg" block className="mt-4">
        <Link href="/map">
          <Compass /> {t("exploreCta")}
        </Link>
      </Button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("demoProgress")}</p>
    </section>
  );
}

export function CompanionCard() {
  const t = useTranslations("game");
  const state = useGameState();
  return (
    <section aria-labelledby="companion-title" className={card}>
      <p id="companion-title" className={eyebrow}>
        {t("companionTitle")}
      </p>
      {state.companion ? null : (
        <div className="mt-2 flex items-center gap-3">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-inset text-muted-foreground" aria-hidden>
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{t("companionEmpty")}</p>
            <p className="text-sm text-muted-foreground">{t("companionEmptyBody")}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function CollectionCard() {
  const t = useTranslations("game");
  const state = useGameState();
  const found = new Set(state.collection);
  return (
    <section aria-labelledby="collection-title" className={card}>
      <div className="flex items-baseline justify-between gap-2">
        <p id="collection-title" className={eyebrow}>
          {t("collectionTitle")}
        </p>
        <Link href="/collection" className="text-xs font-semibold text-primary hover:underline">
          {t("seeCollection")}
        </Link>
      </div>
      <p className="mt-1 font-display text-lg font-bold">{t("collectionCount", { count: found.size, total: COLLECTION_SIZE })}</p>
      <ul className="mt-3 grid grid-cols-7 gap-1.5">
        {ELEMENTS.map((el) => {
          const isFound = found.has(el);
          const name = t(`elements.${el}`);
          return (
            <li key={el} className="flex flex-col items-center gap-1">
              <span
                className={cn("inline-flex aspect-square w-full items-center justify-center rounded-2xl", isFound ? "bg-primary/10" : "bg-inset")}
                aria-label={isFound ? name : t("elementLocked", { element: name })}
                role="img"
              >
                <ElementEmblem element={el} found={isFound} className="size-[70%]" />
              </span>
              <span className="w-full truncate text-center text-[10px] text-muted-foreground" aria-hidden>
                {name}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("provisional")}</p>
    </section>
  );
}
