/**
 * Météo pendant la visite — fonctions PURES (testées).
 * Source production : Open-Meteo (https://open-meteo.com, attribution CC BY 4.0 obligatoire).
 * Mode démo : prévision simulée déterministe (aucun appel réseau).
 */

export interface HourlyWeather {
  /** Heure locale du parc, format ISO sans fuseau : "2026-09-27T14:00" */
  time: string;
  tempC: number;
  precipProb: number;
  code: number;
  windKmh: number;
  uv: number;
}

export interface Forecast {
  source: "open-meteo" | "demo";
  hours: HourlyWeather[];
}

export type WeatherKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "showers" | "storm";
export type AdviceKey = "rain" | "heat" | "cold" | "wind" | "uv" | "nice";

/** Codes météo WMO → catégorie affichée. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 80 && code <= 82) return "showers";
  if (code >= 95) return "storm";
  return "cloudy";
}

/** Analyse la réponse JSON d'Open-Meteo (paramètres hourly demandés par fetchOpenMeteo). */
export function parseOpenMeteo(json: unknown): Forecast | null {
  const h = (json as { hourly?: Record<string, unknown[]> } | null)?.hourly;
  if (!h || !Array.isArray(h.time)) return null;
  const n = (arr: unknown[] | undefined, i: number) => (typeof arr?.[i] === "number" ? (arr[i] as number) : 0);
  return {
    source: "open-meteo",
    hours: h.time.map((time, i) => ({
      time: String(time),
      tempC: n(h.temperature_2m, i),
      precipProb: n(h.precipitation_probability, i),
      code: n(h.weather_code, i),
      windKmh: n(h.wind_speed_10m, i),
      uv: n(h.uv_index, i),
    })),
  };
}

/** Heure locale "YYYY-MM-DDTHH:00" dans le fuseau du parc. */
export function localHourKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:00`;
}

export interface VisitWeatherSummary {
  source: Forecast["source"];
  now: HourlyWeather;
  window: HourlyWeather[];
  rainAt: string | null;
  maxWindKmh: number;
  maxUv: number;
  maxTempC: number;
  minTempC: number;
  advice: AdviceKey[];
}

/** Résume la météo sur la durée de la visite (à partir de l'heure courante). */
export function summarizeVisit(f: Forecast, nowKey: string, durationMin = 120): VisitWeatherSummary | null {
  const start = f.hours.findIndex((h) => h.time >= nowKey);
  if (start < 0) return null;
  const window = f.hours.slice(start, start + Math.max(1, Math.ceil(durationMin / 60)) + 1);
  const now = window[0];
  const rainy = window.find((h) => h.precipProb >= 50 || ["rain", "showers", "storm", "drizzle"].includes(weatherKind(h.code)));
  const maxWindKmh = Math.max(...window.map((h) => h.windKmh));
  const maxUv = Math.max(...window.map((h) => h.uv));
  const maxTempC = Math.max(...window.map((h) => h.tempC));
  const minTempC = Math.min(...window.map((h) => h.tempC));
  const advice: AdviceKey[] = [];
  if (rainy) advice.push("rain");
  if (maxWindKmh >= 50 || window.some((h) => weatherKind(h.code) === "storm")) advice.push("wind");
  if (maxTempC >= 28) advice.push("heat");
  if (minTempC <= 6) advice.push("cold");
  if (maxUv >= 6) advice.push("uv");
  if (!advice.length) advice.push("nice");
  return { source: f.source, now, window, rainAt: rainy ? rainy.time.slice(11, 16) : null, maxWindKmh, maxUv, maxTempC, minTempC, advice };
}

/** Prévision SIMULÉE pour le mode démo : réaliste, déterministe, sans réseau. */
export function demoForecast(dayKey: string): Forecast {
  const day = Number(dayKey.slice(8, 10)) || 1;
  const month = Number(dayKey.slice(5, 7)) || 6;
  const seasonal = [4, 5, 9, 12, 16, 19, 21, 21, 17, 13, 8, 5][month - 1];
  const hours: HourlyWeather[] = [];
  const next = new Date(`${dayKey}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const days = [dayKey, next.toISOString().slice(0, 10)];
  for (let i = 0; i < 48; i++) {
    const h = i % 24;
    const key = days[Math.floor(i / 24)];
    const curve = Math.sin(((h - 8) / 24) * Math.PI * 2) * 4;
    const showers = day % 2 === 1 && h >= 15 && h <= 16;
    hours.push({
      time: `${key}T${String(h).padStart(2, "0")}:00`,
      tempC: Math.round((seasonal + curve) * 10) / 10,
      precipProb: showers ? 65 : h >= 13 && h <= 17 ? 25 : 5,
      code: showers ? 80 : h >= 11 && h <= 18 ? 2 : 1,
      windKmh: 12 + (h % 5) * 2,
      uv: h >= 10 && h <= 16 ? (month >= 5 && month <= 8 ? 6 : 3) : 0,
    });
  }
  return { source: "demo", hours };
}
