import { NextResponse } from "next/server";

import { haversineDistanceKm } from "@/lib/geo";
import { getZonesWithPredictions } from "@/lib/zones";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get("lat") ?? "-6.1659");
  const lon = Number(url.searchParams.get("lon") ?? "39.2026");

  const zones = (await getZonesWithPredictions())
    .map((zone) => ({
      ...zone,
      distanceKm: haversineDistanceKm(lat, lon, zone.latitude, zone.longitude),
    }))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return NextResponse.json({ success: true, zones });
}
