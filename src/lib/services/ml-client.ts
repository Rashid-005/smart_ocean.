// Client for the independent Python/FastAPI ML service (Phase 6).
// Falls back to DB/mock when ML_SERVICE_URL is unset or unreachable.

export function getMlBaseUrl() {
  return (process.env.ML_SERVICE_URL ?? "").replace(/\/$/, "");
}

export function isMlConfigured() {
  return Boolean(getMlBaseUrl());
}

export type MlPrediction = {
  zoneId: string;
  potential: number;
  confidence: string;
  species: string[];
  recommendedTime: string;
  modelVersion: string;
  generatedAt: string;
};

async function fetchWithTimeout(url: string, init: RequestInit, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Ask the Python service for a zone by its display name ("Zone A"),
// but tag the result with the DB zone id so the frontend can join.
export async function mlPredictForZone(
  dbZoneId: string,
  zoneName: string,
): Promise<MlPrediction | null> {
  const base = getMlBaseUrl();
  if (!base) return null;
  try {
    const res = await fetchWithTimeout(
      `${base}/predict`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: zoneName }),
        cache: "no-store",
      },
      8000,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      zoneId: dbZoneId,
      potential: data.potential,
      confidence: data.confidence,
      species: data.species ?? [],
      recommendedTime: data.recommendedTime,
      modelVersion: data.modelVersion ?? "MVP_MOCK_v1",
      generatedAt: data.generatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function mlHealth(): Promise<{ ok: boolean; modelVersion?: string }> {
  const base = getMlBaseUrl();
  if (!base) return { ok: false };
  try {
    const res = await fetchWithTimeout(`${base}/health`, { method: "GET", cache: "no-store" }, 8000);
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, modelVersion: data.modelVersion };
  } catch {
    return { ok: false };
  }
}
