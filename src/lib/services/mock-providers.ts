import {
  getSafetyStatus,
  haversineDistanceKm,
  mockPredictions,
  mockWeather,
  mockZones,
} from "@/lib/mock-backend";
import type {
  AIContext,
  AIProvider,
  DemoLocation,
  MapProvider,
  OceanDataProvider,
  PredictionProvider,
  RoutingProvider,
  SafetyResult,
  WeatherProvider,
} from "./providers";

export class DemoMapProvider implements MapProvider {
  getDemoLocation(): DemoLocation {
    return {
      label: "Zanzibar – Unguja",
      latitude: -6.1659,
      longitude: 39.2026,
      accuracy: 12,
      source: "demo",
    };
  }
}

export class DemoRoutingProvider implements RoutingProvider {
  getRoute(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) {
    const distanceKm = haversineDistanceKm(from.latitude, from.longitude, to.latitude, to.longitude);
    // Demo boat speed ~20 km/h for ETA.
    const etaMinutes = Math.max(1, Math.round((distanceKm / 20) * 60));
    return { distanceKm, etaMinutes, source: "MOCK" as const };
  }
}

export class MockWeatherProvider implements WeatherProvider {
  getCurrentWeather() {
    return { ...mockWeather, source: "MOCK" as const };
  }
}

export class MockOceanProvider implements OceanDataProvider {
  getOceanSnapshot() {
    return { ...mockWeather, source: "MOCK" as const };
  }
}

export function getMockSafetyResult(): SafetyResult {
  return {
    status: getSafetyStatus(),
    weather: { ...mockWeather },
    source: "MOCK",
  };
}

export class MockPredictionProvider implements PredictionProvider {
  readonly modelVersion = "MVP_MOCK_v1";

  listPredictions() {
    return mockPredictions.map((p) => ({ ...p }));
  }

  getPredictionForZone(zoneId: string) {
    return mockPredictions.find((p) => p.zoneId === zoneId) ?? null;
  }
}

// Stub for Phase 6: talks to Python FastAPI when configured, else falls back.
export class PythonMLProvider implements PredictionProvider {
  readonly modelVersion = "MVP_MOCK_v1";
  private fallback = new MockPredictionProvider();

  listPredictions() {
    // Real HTTP call happens in the API route (async). Sync path returns mock.
    return this.fallback.listPredictions();
  }

  getPredictionForZone(zoneId: string) {
    return this.fallback.getPredictionForZone(zoneId);
  }

  get baseUrl() {
    return process.env.ML_SERVICE_URL ?? "";
  }

  get isConfigured() {
    return Boolean(process.env.ML_SERVICE_URL);
  }
}

// Grounded mock AI: only answers from trusted context, never invents data.
// Includes basic prompt-injection guard for Phase 8 readiness.
export class MockAIProvider implements AIProvider {
  readonly source = "MOCK" as const;

  chat(message: string, context: AIContext) {
    const cleaned = message.trim().slice(0, 1000);
    const lowered = cleaned.toLowerCase();

    const injectionPattern =
      /ignore (previous|all|prior) instructions|disregard .*instructions|system prompt|reveal .*prompt|jailbreak|dan mode|you are now|pretend (to be|you)|override .*safe|do anything now/i;
    if (injectionPattern.test(cleaned)) {
      return {
        reply:
          "I can only help with Smart Ocean fishing, zones, safety, and reports using verified app data.",
        source: "MOCK",
      };
    }

    const topZone =
      [...context.zones].sort((a, b) => b.potential - a.potential)[0] ?? mockZones[0];
    const topPrediction =
      context.predictions.find((p) => p.zoneId === topZone.id) ?? context.predictions[0];

    if (!cleaned) {
      return {
        reply: "Please ask about fishing zones, safety, or best fishing time.",
        source: "MOCK",
      };
    }

    if (lowered.includes("salama") || lowered.includes("safety") || lowered.includes("safe") || lowered.includes("bahari")) {
      return {
        reply: `Ocean status is ${context.safetyStatus} (wind ${context.weather.windSpeedKmh} km/h, waves ${context.weather.waveHeightM} m, ${context.weather.description}). [source: MOCK]`,
        source: "MOCK",
      };
    }

    if (
      lowered.includes("wapi") ||
      lowered.includes("where") ||
      lowered.includes("zone") ||
      lowered.includes("potential") ||
      lowered.includes("samaki") ||
      lowered.includes("species")
    ) {
      if (topZone && topPrediction) {
        return {
          reply: `${topZone.name} has the highest potential at ${topPrediction.potential}% (${topPrediction.confidence} confidence). Species: ${topPrediction.species.join(", ")}. Recommended time ${topPrediction.recommendedTime}. [source: MOCK, model ${topPrediction.modelVersion}]`,
          source: "MOCK",
        };
      }
    }

    if (lowered.includes("wakati") || lowered.includes("time") || lowered.includes("saa")) {
      if (topPrediction) {
        return {
          reply: `Recommended fishing time for ${topZone?.name ?? "best zone"} is ${topPrediction.recommendedTime}. [source: MOCK]`,
          source: "MOCK",
        };
      }
    }

    return {
      reply: `Based on verified app data: best zone is ${topZone?.name ?? "Zone A"} (${topPrediction?.potential ?? 87}%), safety is ${context.safetyStatus}. Ask me "Leo niende wapi?" or "Bahari iko salama?" [source: MOCK]`,
      source: "MOCK",
    };
  }
}
