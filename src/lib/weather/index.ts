import "server-only";
import { isDemoMode } from "@/lib/config/app-mode";
import type { LatLng } from "@/lib/domain/types";
import { demoForecast, localHourKey, parseOpenMeteo, summarizeVisit, type Forecast, type VisitWeatherSummary } from "./weather";

export type { VisitWeatherSummary };

/**
 * Service météo. On envoie les coordonnées du PARC (jamais celles du visiteur).
 * - Mode démo : prévision simulée (sauf WEATHER_LIVE=true).
 * - Sinon : Open-Meteo, mis en cache 30 min côté serveur.
 * En cas d'erreur réseau : null → l'UI affiche « Météo indisponible ».
 */
const useLive = !isDemoMode || process.env.WEATHER_LIVE === "true";

async function fetchOpenMeteo(location: LatLng, timeZone: string): Promise<Forecast | null> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", location.lat.toFixed(4));
  url.searchParams.set("longitude", location.lng.toFixed(4));
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code,wind_speed_10m,uv_index");
  url.searchParams.set("timezone", timeZone);
  url.searchParams.set("forecast_days", "2");
  try {
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return parseOpenMeteo(await res.json());
  } catch {
    return null;
  }
}

export async function getVisitWeather(location: LatLng, timeZone: string, durationMin = 120): Promise<VisitWeatherSummary | null> {
  const nowKey = localHourKey(new Date(), timeZone);
  const forecast = useLive ? await fetchOpenMeteo(location, timeZone) : demoForecast(nowKey.slice(0, 10));
  return forecast ? summarizeVisit(forecast, nowKey, durationMin) : null;
}
