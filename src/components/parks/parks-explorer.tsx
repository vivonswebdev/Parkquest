"use client";

import { Globe2, LayoutGrid, Minus, Plus, RotateCcw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ParkSummary } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "botanical", "urban", "historic", "natural", "family", "photo", "pmr", "free", "paid"] as const;
type FilterKey = (typeof FILTERS)[number];

function matchesFilter(p: ParkSummary, f: FilterKey): boolean {
  switch (f) {
    case "all":
      return true;
    case "botanical":
      return p.type === "BOTANICAL_GARDEN" || p.type === "ARBORETUM";
    case "urban":
      return p.type === "URBAN_PARK" || p.tags.includes("urban");
    case "historic":
      return p.type === "HISTORIC_PARK" || p.tags.includes("historic");
    case "natural":
      return p.type === "NATURAL_PARK";
    case "family":
      return p.tags.includes("family");
    case "photo":
      return p.tags.includes("photo");
    case "pmr":
      return Boolean(p.isPmrFriendly);
    case "free":
      return p.isFree === true;
    case "paid":
      return p.isFree === false;
  }
}

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Synonymes de villes courants (recherche multilingue simple). */
const CITY_ALIASES: Record<string, string[]> = {
  london: ["londres", "londen"],
  "new york": ["nueva york", "nyc"],
  paris: ["parijs"],
  meise: ["bruxelles", "brussel", "brussels", "bruselas", "brussel"],
};

export function ParksExplorer({ parks, cards }: { parks: ParkSummary[]; cards: Record<string, React.ReactNode> }) {
  const t = useTranslations("parks");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(["all"]));
  const [view, setView] = useState<"cards" | "map">("cards");
  const q = useDeferredValue(normalize(query.trim()));

  const results = useMemo(
    () =>
      parks.filter((p) => {
        const hay = normalize([p.name, p.city, p.countryCode, ...(CITY_ALIASES[normalize(p.city)] ?? [])].join(" "));
        const okQuery = !q || hay.includes(q);
        const okFilter = filters.has("all") || [...filters].every((f) => matchesFilter(p, f));
        return okQuery && okFilter;
      }),
    [parks, q, filters],
  );

  const toggle = (f: FilterKey) =>
    setFilters((cur) => {
      if (f === "all") return new Set(["all"]);
      const next = new Set(cur);
      next.delete("all");
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next.size ? next : new Set(["all"]);
    });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="glass relative flex h-14 shrink-0 items-center md:flex-1 gap-3 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-5 text-primary" aria-hidden />
          <span className="sr-only">{t("searchPlaceholder")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-full flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="×" className="text-muted-foreground">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="glass flex h-14 rounded-2xl p-1" role="tablist">
          {(["cards", "map"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              type="button"
              onClick={() => setView(v)}
              className={cn("flex flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              {v === "cards" ? <LayoutGrid className="size-4" /> : <Globe2 className="size-4" />}
              {v === "cards" ? t("viewCards") : t("viewMap")}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filtres">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filters.has(f)}
            onClick={() => toggle(f)}
            className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors", filters.has(f) ? "bg-primary text-primary-foreground" : "glass text-foreground hover:border-primary/40")}
          >
            {t(`filters.${f}`)}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border p-10 text-center">
          <p className="text-muted-foreground">{t("noResults")}</p>
          <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setFilters(new Set(["all"])); }}>
            <RotateCcw /> {t("resetFilters")}
          </Button>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{results.map((p) => <div key={p.id}>{cards[p.id]}</div>)}</div>
      ) : (
        <WorldMap parks={results} hint={t("worldMapHint")} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carte du monde (sans dépendance) : regroupement par zoom monde → région → ville.
// ---------------------------------------------------------------------------

const W = 1000;
const H = 500;
const LEVELS = [
  { cell: 30, span: 1 },
  { cell: 8, span: 4 },
  { cell: 1, span: 16 },
  { cell: 0.05, span: 80 },
];

function WorldMap({ parks, hint }: { parks: ParkSummary[]; hint: string }) {
  const [level, setLevel] = useState(0);
  const [center, setCenter] = useState({ lat: 25, lng: 0 });
  const { cell, span } = LEVELS[level];
  const proj = (lat: number, lng: number) => ({
    x: W / 2 + ((lng - center.lng) / 360) * W * span,
    y: H / 2 - ((lat - center.lat) / 180) * H * span,
  });

  const clusters = useMemo(() => {
    const m = new Map<string, ParkSummary[]>();
    for (const p of parks) {
      const k = `${Math.floor(p.location.lat / cell)}:${Math.floor(p.location.lng / cell)}`;
      m.set(k, [...(m.get(k) ?? []), p]);
    }
    return [...m.values()].map((items) => ({
      items,
      lat: items.reduce((a, p) => a + p.location.lat, 0) / items.length,
      lng: items.reduce((a, p) => a + p.location.lng, 0) / items.length,
    }));
  }, [parks, cell]);

  const zoomTo = (lat: number, lng: number, l: number) => {
    setCenter({ lat, lng });
    setLevel(Math.min(LEVELS.length - 1, Math.max(0, l)));
  };

  const grat: React.ReactNode[] = [];
  for (let lng = -180; lng <= 180; lng += 30) {
    const a = proj(90, lng);
    const b = proj(-90, lng);
    grat.push(<line key={`g${lng}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
  }
  for (let lat = -60; lat <= 90; lat += 30) {
    const a = proj(lat, -180);
    const b = proj(lat, 180);
    grat.push(<line key={`t${lat}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={hint}>
        <defs>
          <radialGradient id="wm-glow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stopColor="var(--surface-elevated)" />
            <stop offset="1" stopColor="var(--background)" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#wm-glow)" />
        <g stroke="var(--map-topo)">{grat}</g>
        {clusters.map((c) => {
          const p = proj(c.lat, c.lng);
          if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H + 40) return null;
          const single = c.items.length === 1;
          if (single && level >= 2) {
            const park = c.items[0];
            return (
              <Link key={park.id} href={`/parks/${park.slug}`}>
                <g className="cursor-pointer">
                  <circle cx={p.x} cy={p.y} r={10} fill="#19E6A2" stroke="var(--background)" strokeWidth={3} />
                  <rect x={p.x + 14} y={p.y - 14} rx={10} width={park.name.length * 8 + 20} height={28} fill="var(--background)" fillOpacity={0.9} stroke="#19E6A2" strokeOpacity={0.3} />
                  <text x={p.x + 24} y={p.y + 5} fill="var(--foreground)" fontSize={14} fontWeight={600}>{park.name}</text>
                </g>
              </Link>
            );
          }
          const r = 14 + Math.min(16, c.items.length * 3);
          return (
            <g key={`${c.lat}${c.lng}`} className="cursor-pointer" onClick={() => zoomTo(c.lat, c.lng, level + 1)} role="button" aria-label={`${c.items.length}`}>
              <circle cx={p.x} cy={p.y} r={r + 8} fill="#19E6A2" fillOpacity={0.12} />
              <circle cx={p.x} cy={p.y} r={r} fill="#0B6B4F" stroke="#19E6A2" strokeWidth={2} />
              <text x={p.x} y={p.y + 5} textAnchor="middle" fill="#F5FFFA" fontSize={15} fontWeight={700}>{c.items.length}</text>
            </g>
          );
        })}
      </svg>
      <p className="absolute left-3 top-3 max-w-[70%] glass-strong rounded-full px-3 py-1.5 text-xs text-muted-foreground">{hint}</p>
      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <button type="button" aria-label="+" onClick={() => setLevel((l) => Math.min(LEVELS.length - 1, l + 1))} className="glass-strong inline-flex size-11 items-center justify-center rounded-full"><Plus className="size-5" /></button>
        <button type="button" aria-label="−" onClick={() => setLevel((l) => Math.max(0, l - 1))} className="glass-strong inline-flex size-11 items-center justify-center rounded-full"><Minus className="size-5" /></button>
        <button type="button" aria-label="reset" onClick={() => zoomTo(25, 0, 0)} className="glass-strong inline-flex size-11 items-center justify-center rounded-full"><Globe2 className="size-5" /></button>
      </div>
    </div>
  );
}
