import { z } from "zod";
import { UserFacingError } from "../libs/error.js";

// Open-Meteo: free, no API key. Docs: https://open-meteo.com/en/docs
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const MAX_FORECAST_DAYS = 16; // Open-Meteo forecast horizon

// ---------- response schemas (never trust external JSON blindly) ----------

const GeoSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        admin1: z.string().optional(), // state, e.g. "Himachal Pradesh"
      }),
    )
    .optional(),
});

const ForecastSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number().nullable()),
    temperature_2m_max: z.array(z.number().nullable()),
    temperature_2m_min: z.array(z.number().nullable()),
    precipitation_sum: z.array(z.number().nullable()),
    snowfall_sum: z.array(z.number().nullable()),
  }),
});

// ---------- helpers ----------

async function getJson<T>(url: URL, schema: z.ZodType<T>, signal: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { signal, headers: { accept: "application/json" } });
  } catch (err) {
    if (signal.aborted) throw err; // let the caller report timeout/cancel
    throw new UserFacingError("Weather service is unreachable right now. Try again later.");
  }
  if (!res.ok) {
    throw new UserFacingError(`Weather service returned an error (HTTP ${res.status}). Try again later.`);
  }
  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) throw new Error(`Unexpected response from ${url.host}: ${parsed.error.message}`);
  return parsed.data;
}

/** WMO weather codes -> short text */
function describe(code: number | null): string {
  if (code === null) return "unknown";
  if (code === 0) return "clear sky";
  if (code <= 3) return "partly cloudy";
  if (code <= 48) return "fog";
  if (code <= 57) return "drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain showers";
  if (code <= 86) return "snow showers";
  return "thunderstorm";
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIST(): string {
  // en-CA formats as YYYY-MM-DD
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

// ---------- public API ----------

export interface DayForecast {
  date: string;
  condition: string;
  maxTempC: number | null;
  minTempC: number | null;
  rainMm: number | null;
  snowCm: number | null;
}

export interface TripWeather {
  place: string;
  state: string | null;
  days: DayForecast[];
  warnings: string[];
}

export async function getTripWeather(
  input: { city: string; startDate: string; days: number },
  signal: AbortSignal,
): Promise<TripWeather> {
  console.error("input",input)
  console.error("signal",signal)
  const today = todayIST();
  const lastAvailable = addDays(today, MAX_FORECAST_DAYS - 1);
  if (input.startDate < today) throw new UserFacingError("Start date is in the past.");
  if (input.startDate > lastAvailable) {
    throw new UserFacingError(
      `Forecast is only available until ${lastAvailable}. For later dates, share typical seasonal weather instead.`,
    );
  }
  const endDate = [addDays(input.startDate, input.days - 1), lastAvailable].sort()[0]!;

  // 2. City name -> coordinates (India only)
  const geoUrl = new URL(GEO_URL);
  geoUrl.search = new URLSearchParams({ name: input.city, count: "1", countryCode: "IN", language: "en" }).toString();
  const geo = await getJson(geoUrl, GeoSchema, signal);
  const results = geo.results ?? [];
  const place = results.find((r) => r.admin1 === "Himachal Pradesh") ?? results[0];
  if (!place) throw new UserFacingError(`Could not find a place named "${input.city}" in India.`);

  // 3. Daily forecast for the trip dates
  const fcUrl = new URL(FORECAST_URL);
  fcUrl.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum",
    timezone: "Asia/Kolkata",
    start_date: input.startDate,
    end_date: endDate,
  }).toString();
  const fc = await getJson(fcUrl, ForecastSchema, signal);

  const d = fc.daily;
  const days: DayForecast[] = d.time.map((date, i) => ({
    date,
    condition: describe(d.weather_code[i] ?? null),
    maxTempC: d.temperature_2m_max[i] ?? null,
    minTempC: d.temperature_2m_min[i] ?? null,
    rainMm: d.precipitation_sum[i] ?? null,
    snowCm: d.snowfall_sum[i] ?? null,
  }));

  // 4. Travel-relevant warnings
  const warnings: string[] = [];
  if (days.some((x) => (x.snowCm ?? 0) >= 5)) warnings.push("Heavy snowfall expected; roads/passes may close.");
  if (days.some((x) => (x.rainMm ?? 0) >= 30)) warnings.push("Heavy rain expected; landslide risk on hill roads.");
  if (days.some((x) => (x.minTempC ?? 99) <= 0)) warnings.push("Sub-zero nights; pack heavy woollens.");
  if (endDate < addDays(input.startDate, input.days - 1)) {
    warnings.push(`Forecast covers only until ${endDate}; later days are not available yet.`);
  }

  return { place: place.name, state: place.admin1 ?? null, days, warnings };
}