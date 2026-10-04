import { db } from "@/lib/db";

// Shape DB zones to the frontend/API contract (includes species from latest prediction).
export async function getZonesWithPredictions() {
  const zones = await db.fishingZone.findMany({
    where: { active: true },
    include: {
      predictions: { orderBy: { generatedAt: "desc" }, take: 1 },
    },
    orderBy: { potential: "desc" },
  });

  return zones.map((z) => {
    const latest = z.predictions[0];
    return {
      id: z.id,
      name: z.name,
      island: z.island,
      latitude: z.latitude,
      longitude: z.longitude,
      potential: latest?.potential ?? z.potential,
      confidence:
        latest?.confidence
          ? latest.confidence.charAt(0) + latest.confidence.slice(1).toLowerCase()
          : z.confidence.charAt(0) + z.confidence.slice(1).toLowerCase(),
      species: latest?.species ?? [],
      recommendedTime: latest?.recommendedTime ?? z.recommendedTime,
      safety:
        z.safety === "SAFE" ? "Safe" : z.safety === "MODERATE" ? "Caution" : "Dangerous",
      safetyRaw: z.safety,
    };
  });
}

export async function getLatestWeather() {
  const row =
    (await db.weatherData.findFirst({ orderBy: { timestamp: "desc" } })) ??
    (await db.oceanCondition.findFirst({ orderBy: { timestamp: "desc" } }));

  if (!row) {
    return {
      windSpeedKmh: 12,
      waveHeightM: 0.8,
      visibilityKm: 10,
      temperatureC: 27,
      description: "Clear with light breeze",
      source: "MOCK",
    };
  }

  return {
    windSpeedKmh: row.windSpeedKmh,
    waveHeightM: row.waveHeightM,
    visibilityKm: row.visibilityKm,
    temperatureC: row.temperatureC,
    description: row.description,
    source: (row as { source?: string }).source ?? "MOCK",
  };
}
