import type {
  Prediction,
  SafetyStatus,
  WeatherSnapshot,
  Zone,
} from "@/lib/mock-backend";

// ─── Provider contracts (SYSTEM_ARCHITECTURE §3, MVP_BUILD_VS_MOCK) ───
// Mock implementations must live behind these interfaces so real providers
// can replace them later without rewriting UI or business logic.

export type DemoLocation = {
  label: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: "demo" | "gps" | "LIVE" | "MOCK" | "SEEDED";
};

export interface MapProvider {
  getDemoLocation(): DemoLocation;
}

export interface RoutingProvider {
  getRoute(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ): { distanceKm: number; etaMinutes: number; source: "MOCK" | "LIVE" | "SEEDED" };
}

export interface WeatherProvider {
  getCurrentWeather(): WeatherSnapshot & { source: "MOCK" | "LIVE" | "SEEDED" };
}

export interface OceanDataProvider {
  getOceanSnapshot(): WeatherSnapshot & { source: "MOCK" | "LIVE" | "SEEDED" };
}

export interface PredictionInput {
  latitude?: number;
  longitude?: number;
  zoneId?: string;
  windSpeedKmh?: number;
  waveHeightM?: number;
}

export interface PredictionProvider {
  readonly modelVersion: string;
  listPredictions(): Prediction[];
  getPredictionForZone(zoneId: string): Prediction | null;
}

export interface AIContext {
  location: DemoLocation | null;
  zones: Zone[];
  predictions: Prediction[];
  safetyStatus: SafetyStatus;
  weather: WeatherSnapshot;
}

export interface AIProvider {
  readonly source: "MOCK" | "LIVE" | "ML_MODEL";
  chat(message: string, context: AIContext): { reply: string; source: string };
}

export interface SafetyResult {
  status: SafetyStatus;
  weather: WeatherSnapshot;
  source: "MOCK" | "LIVE" | "SEEDED";
}
