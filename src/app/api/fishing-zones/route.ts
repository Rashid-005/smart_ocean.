import { NextResponse } from "next/server";

import { haversineDistanceKm } from "@/lib/geo";
import { getZonesWithPredictions } from "@/lib/zones";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lon = url.searchParams.get("lon");

  let zones = await getZonesWithPredictions();

  if (lat && lon) {
    const currentLat = Number(lat);
    const currentLon = Number(lon);
    zones = zones
      .map((zone) => ({
        ...zone,
        distanceKm: haversineDistanceKm(currentLat, currentLon, zone.latitude, zone.longitude),
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  return NextResponse.json({ success: true, zones });
}
