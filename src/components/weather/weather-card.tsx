import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Droplets, FlaskConical, Sun, SunMedium, Wind, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { VisitWeatherSummary } from "@/lib/weather";
import { weatherKind, type WeatherKind } from "@/lib/weather/weather";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  showers: CloudRain,
  storm: CloudLightning,
};

/** Carte « Météo pendant votre visite » (Server Component). */
export async function WeatherCard({ weather, className, compact }: { weather: VisitWeatherSummary | null; className?: string; compact?: boolean }) {
  const t = await getTranslations("weather");
  if (!weather) {
    return <p className={cn("rounded-[var(--radius-card)] border border-border bg-surface p-4 text-sm text-muted-foreground", className)}>{t("unavailable")}</p>;
  }
  const kind = weatherKind(weather.now.code);
  const Icon = KIND_ICON[kind];
  return (
    <section aria-labelledby="weather-title" className={cn("rounded-[var(--radius-card)] border border-border bg-surface p-4 card-shadow", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="weather-title" className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
            {t("title")}
          </h2>
          <p className="mt-1 flex items-center gap-2">
            <Icon className="size-8 text-gold" aria-hidden />
            <span className="font-display text-3xl font-extrabold tabular-nums">{Math.round(weather.now.tempC)}°</span>
            <span className="text-sm text-muted-foreground">{t(`codes.${kind}`)}</span>
          </p>
        </div>
        {weather.source === "demo" && (
          <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-gold">
            <FlaskConical className="size-3" /> {t("simulated")}
          </span>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <li className="inline-flex items-center gap-1.5">
          <Droplets className="size-4 text-primary" aria-hidden />
          {weather.rainAt ? t("rainAt", { hour: weather.rainAt }) : t("noRain")}
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Wind className="size-4 text-primary" aria-hidden />
          {t("wind", { speed: Math.round(weather.maxWindKmh) })}
        </li>
        {weather.maxUv > 0 && (
          <li className="inline-flex items-center gap-1.5">
            <SunMedium className="size-4 text-primary" aria-hidden />
            {t("uv", { value: Math.round(weather.maxUv) })}
          </li>
        )}
      </ul>

      {!compact && (
        <ol className="no-scrollbar mt-3 flex gap-2 overflow-x-auto" aria-label={t("title")}>
          {weather.window.map((h, i) => {
            const HIcon = KIND_ICON[weatherKind(h.code)];
            return (
              <li key={h.time} className="flex min-w-14 flex-col items-center gap-1 rounded-2xl bg-inset px-2 py-2 text-xs">
                <span className="text-muted-foreground">{i === 0 ? t("now") : h.time.slice(11, 16)}</span>
                <HIcon className="size-4" aria-hidden />
                <span className="font-semibold tabular-nums">{Math.round(h.tempC)}°</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">{h.precipProb} %</span>
              </li>
            );
          })}
        </ol>
      )}

      <ul className="mt-3 space-y-1">
        {weather.advice.map((a) => (
          <li key={a} className="text-sm font-medium">
            {t(`advice.${a}`)}
          </li>
        ))}
      </ul>
      {weather.source === "open-meteo" && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            {t("source")}
          </a>
        </p>
      )}
    </section>
  );
}
