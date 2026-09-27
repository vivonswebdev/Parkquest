"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { THEME_COLORS, THEME_STORAGE_KEY, type ThemePref } from "./theme";

const listeners = new Set<() => void>();
const media = () => window.matchMedia("(prefers-color-scheme: light)");

function readPref(): ThemePref | "default" {
  try {
    const p = localStorage.getItem(THEME_STORAGE_KEY);
    return p === "dark" || p === "light" || p === "system" ? p : "default";
  } catch {
    return "default";
  }
}

/** Applique une préférence sur <html> (même logique que le script d'initialisation). */
function apply(pref: ThemePref | "default") {
  const resolved = pref === "light" || (pref === "system" && media().matches) ? "light" : "dark";
  const el = document.documentElement;
  el.dataset.themePref = pref;
  el.dataset.theme = resolved;
  el.style.colorScheme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[resolved]);
  listeners.forEach((l) => l());
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* stockage indisponible : le choix vaut pour la session */
  }
  apply(pref);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function useThemePref() {
  const pref = useSyncExternalStore(
    subscribe,
    readPref,
    () => "default" as const,
  );
  // Mode « Système » : suivre les changements du réglage de l'appareil.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = media();
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);
  return pref;
}

const OPTIONS = [
  { value: "dark", icon: Moon, key: "themeDark" },
  { value: "light", icon: Sun, key: "themeLight" },
  { value: "system", icon: Monitor, key: "themeSystem" },
] as const;

/** Sélecteur complet Sombre / Clair / Système (profil, paramètres). */
export function ThemeSwitcher({ className }: { className?: string }) {
  const t = useTranslations("common");
  const pref = useThemePref();
  const current = pref === "default" ? "dark" : pref;
  return (
    <div role="radiogroup" aria-label={t("theme")} className={cn("glass inline-flex rounded-full p-1", className)}>
      {OPTIONS.map(({ value, icon: Icon, key }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setThemePref(value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span>{t(key)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Bouton compact : bascule sombre ↔ clair (en-têtes). */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useTranslations("common");
  const isLight = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "light", () => false);
  return (
    <button
      type="button"
      onClick={() => setThemePref(isLight ? "dark" : "light")}
      aria-label={t("themeToggle")}
      title={isLight ? t("themeDark") : t("themeLight")}
      className={cn("glass inline-flex size-11 items-center justify-center rounded-full transition-colors hover:text-primary md:size-10", className)}
    >
      {isLight ? <Moon className="size-5 md:size-[18px]" /> : <Sun className="size-5 md:size-[18px]" />}
    </button>
  );
}

/** Monté une fois dans le layout : suit le réglage de l'appareil en mode « Système ». */
export function ThemeSync() {
  useThemePref();
  return null;
}
