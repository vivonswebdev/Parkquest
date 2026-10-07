"use client";

import { ArrowLeft, Compass, Home, Leaf, Map as MapIcon, MoreHorizontal, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RARITY, type Rarity } from "./creatures";
import { useLabState } from "./use-lab-state";

/* Composants du laboratoire (candidats à la réutilisation si la direction est validée). */

export const LAB = "/fr/lab";

/** Barre haute : retour (optionnel), titre discret, accès au début du prototype et aux outils. */
export function LabTopBar({ back, title, dark }: { back?: string; title?: string; dark?: boolean }) {
  return (
    <header className={cn("lab-safe-top sticky top-0 z-20 flex items-center gap-2 px-4 pb-2", dark ? "text-[#f8f2e4]" : "text-[var(--lab-ink)]")}>
      {back ? (
        <Link href={back} aria-label="Retour" className={cn("grid size-11 place-items-center rounded-full", dark ? "bg-white/10" : "bg-[rgba(31,90,61,0.08)]")}>
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
      ) : (
        <span className="size-11" aria-hidden />
      )}
      <p className="flex-1 truncate text-center text-sm font-semibold opacity-80">{title}</p>
      <LabTools dark={dark} />
    </header>
  );
}

/** Outils de démonstration, discrets, limités au laboratoire. */
export function LabTools({ dark }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const { reset } = useLabState();
  const router = useRouter();
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const item = "flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold hover:bg-[rgba(31,90,61,0.08)]";
  return (
    <>
      <button
        type="button"
        aria-label="Outils du prototype"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(true)}
        className={cn("grid size-11 place-items-center rounded-full", dark ? "bg-white/10" : "bg-[rgba(31,90,61,0.08)]")}
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(23,41,75,0.35)] p-3" onClick={() => setOpen(false)}>
          <div
            id={id}
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Outils du prototype"
            onClick={(e) => e.stopPropagation()}
            className="lab-card lab-fade-up lab-safe-bottom w-full max-w-md p-3 text-[var(--lab-ink)]"
          >
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--lab-ink-soft)]">Outils du prototype</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="grid size-11 place-items-center rounded-full">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <Link href={`${LAB}/welcome`} className={item}>
              <Home className="size-4" aria-hidden /> Revenir au début du prototype
            </Link>
            <Link href={`${LAB}/onboarding/1`} className={item}>
              <RotateCcw className="size-4" aria-hidden /> Recommencer le tutoriel
            </Link>
            <Link href={`${LAB}/hatch?replay=1`} className={item}>
              <Sparkles className="size-4" aria-hidden /> Rejouer l&apos;éclosion
            </Link>
            <Link href={`${LAB}/companion`} className={item}>
              <Leaf className="size-4" aria-hidden /> Voir l&apos;état œuf / compagnon
            </Link>
            <Link href={LAB} className={item}>
              <Compass className="size-4" aria-hidden /> Tous les écrans du prototype
            </Link>
            <button
              type="button"
              className={cn(item, "text-[#9a3b26]")}
              onClick={() => {
                reset();
                setOpen(false);
                router.push(`${LAB}/welcome`);
              }}
            >
              <Trash2 className="size-4" aria-hidden /> Effacer les choix de démonstration
            </button>
            <p className="px-3 pt-2 text-xs text-[var(--lab-ink-soft)]">Prototype de design : aucune donnée réelle, aucun compte créé, aucune position partagée.</p>
          </div>
        </div>
      )}
    </>
  );
}

/** Indicateur d'étape : « 2/5 » + cinq points (lu « Étape 2 sur 5 »). */
export function StepIndicator({ step, total = 5, dark }: { step: number; total?: number; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Étape ${step} sur ${total}`} role="img">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i + 1 === step ? "w-6 bg-[var(--lab-amber)]" : i + 1 < step ? "w-2 bg-[var(--lab-forest)]" : dark ? "w-2 bg-white/25" : "w-2 bg-[rgba(31,90,61,0.18)]",
            )}
          />
        ))}
      </div>
      <span aria-hidden className={cn("text-sm font-bold tabular-nums", dark ? "text-white/80" : "text-[var(--lab-ink-soft)]")}>
        {step}/{total}
      </span>
    </div>
  );
}

/** Zone d'action basse, persistante, utilisable au pouce. */
export function BottomActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("lab-safe-bottom sticky bottom-0 z-10 mt-auto bg-gradient-to-t from-[var(--lab-cream)] via-[var(--lab-cream)] to-transparent px-5 pt-6", className)}>
      <div className="mx-auto flex max-w-md flex-col items-stretch gap-2">{children}</div>
    </div>
  );
}

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const r = RARITY[rarity];
  const shape = { common: "●", uncommon: "◆", rare: "★", legendary: "✦" }[rarity];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border-2 bg-white/80 px-2 py-0.5 text-xs font-bold", className)}
      style={{ color: r.tone, borderColor: r.ring }}
    >
      <span aria-hidden>{shape}</span>
      {r.label}
    </span>
  );
}

export function ProgressBar({ value, max, label, tone = "moss" }: { value: number; max: number; label: string; tone?: "moss" | "amber" }) {
  const pct = Math.round((Math.min(value, max) / Math.max(1, max)) * 100);
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)} className="h-3 w-full overflow-hidden rounded-full bg-[rgba(31,90,61,0.12)]">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: tone === "amber" ? "linear-gradient(90deg,#f2c46b,#e9a23b)" : "linear-gradient(90deg,#8fb36a,#4f7d50)" }}
      />
    </div>
  );
}

/** Carte de choix (radio natif : clavier, lecteur d'écran, état sélectionné écrit + visuel). */
export function ChoiceCard({
  name,
  value,
  checked,
  onChange,
  label,
  hint,
  visual,
  className,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange(v: string): void;
  label: string;
  hint?: string;
  visual?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-[22px] border-2 bg-[var(--lab-paper)] p-3 transition-[border-color,box-shadow] has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--lab-amber)]",
        checked ? "border-[var(--lab-forest)] shadow-[0_8px_20px_-12px_rgba(31,90,61,.6)]" : "border-transparent shadow-[0_1px_2px_rgba(31,61,42,.08)]",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      {visual}
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-[var(--lab-ink-soft)]">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs font-black", checked ? "border-[var(--lab-forest)] bg-[var(--lab-forest)] text-white" : "border-[rgba(31,90,61,0.25)]")}
      >
        {checked ? "✓" : ""}
      </span>
      {checked && <span className="sr-only">(sélectionné)</span>}
    </label>
  );
}

/** Mention de démonstration, discrète mais lisible. */
export function DemoNote({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return <p className={cn("rounded-2xl px-3 py-2 text-center text-xs", dark ? "bg-white/10 text-white/80" : "bg-[rgba(31,90,61,0.07)] text-[var(--lab-ink-soft)]")}>{children}</p>;
}

/** Navigation basse du prototype (4 entrées, uniquement entre écrans /lab). */
export function LabNav() {
  const path = usePathname();
  const items = [
    { href: `${LAB}/home`, label: "Accueil", Icon: Home },
    { href: `${LAB}/map?theme=day`, label: "Carte", Icon: MapIcon },
    { href: `${LAB}/collection`, label: "Collection", Icon: Sparkles },
    { href: `${LAB}/companion`, label: "Compagnon", Icon: Leaf },
  ];
  return (
    <nav aria-label="Navigation du prototype" className="lab-safe-bottom fixed inset-x-0 bottom-0 z-30 px-4">
      <ul className="mx-auto flex max-w-md justify-between rounded-[26px] bg-[rgba(255,250,240,0.94)] p-1.5 shadow-[0_10px_30px_-12px_rgba(23,41,75,.45)] backdrop-blur">
        {items.map(({ href, label, Icon }) => {
          const active = path === href.split("?")[0];
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-[20px] text-[11px] font-bold",
                  active ? "bg-[var(--lab-forest)] text-[#fffaf0]" : "text-[var(--lab-ink-soft)]",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Petit message de retour (lu par les lecteurs d'écran). */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  const node = (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4">
      {msg && <p className="lab-fade-up rounded-full bg-[var(--lab-blue)] px-4 py-2 text-sm font-semibold text-[#fffaf0] shadow-lg">{msg}</p>}
    </div>
  );
  return [node, setMsg] as const;
}
