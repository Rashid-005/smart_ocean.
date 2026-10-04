import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { haversineDistanceKm } from "@/lib/geo";
import { isMlConfigured, mlPredictForZone } from "@/lib/services/ml-client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat") ?? "-6.1659");
  const lon = Number(url.searchParams.get("lon") ?? "39.2026");

  const zones = await db.fishingZone.findMany({ where: { active: true } });

  // Prefer live Python ML per zone when configured; fall back to DB predictions.
  if (isMlConfigured() && zones.length > 0) {
    const live = await Promise.all(zones.map((z) => mlPredictForZone(z.id, z.name)));
    const ok = live.filter((r): r is NonNullable<typeof r> => r !== null);
    if (ok.length > 0) {
      const byZone = new Map(zones.map((z) => [z.id, z]));
      const nearby = ok
        .map((p) => {
          const zone = byZone.get(p.zoneId)!;
          const distanceKm = haversineDistanceKm(lat, lon, zone.latitude, zone.longitude);
          const etaMinutes = Math.max(1, Math.round((distanceKm / 20) * 60));
          return { ...p, id: `ml-${p.zoneId}`, source: "ML_MODEL", distanceKm, etaMinutes };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm);
      return NextResponse.json({
        success: true,
        location: { label: "Current location", latitude: lat, longitude: lon },
        predictions: nearby,
      });
    }
  }

  const predictions = await db.zonePrediction.findMany({
    orderBy: { generatedAt: "desc" },
    take: 20,
    include: { zone: true },
  });

  const nearby = predictions
    .map((p) => {
      const distanceKm = haversineDistanceKm(lat, lon, p.zone.latitude, p.zone.longitude);
      const etaMinutes = Math.max(1, Math.round((distanceKm / 20) * 60));
      return { ...p, distanceKm, etaMinutes };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return NextResponse.json({
    success: true,
    location: { label: "Current location", latitude: lat, longitude: lon },
    predictions: nearby,
  });
}
