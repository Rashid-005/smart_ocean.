import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isMlConfigured, mlPredictForZone } from "@/lib/services/ml-client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const zoneId = url.searchParams.get("zoneId");

  // Single-zone: try live Python ML first, DB fallback.
  if (zoneId) {
    const zone = await db.fishingZone.findUnique({ where: { id: zoneId } });
    if (isMlConfigured() && zone) {
      const ml = await mlPredictForZone(zone.id, zone.name);
      if (ml) return NextResponse.json({ success: true, predictions: [{ ...ml, id: `ml-${zone.id}`, source: "ML_MODEL" }] });
    }
    const predictions = await db.zonePrediction.findMany({
      where: { zoneId },
      orderBy: { generatedAt: "desc" },
      take: 5,
    });
    return NextResponse.json({ success: true, predictions });
  }

  // List: enrich each zone with live ML prediction when configured.
  const zones = await db.fishingZone.findMany({ where: { active: true } });
  if (isMlConfigured() && zones.length > 0) {
    const results = await Promise.all(zones.map((z) => mlPredictForZone(z.id, z.name)));
    const live = results.filter((r): r is NonNullable<typeof r> => r !== null);
    if (live.length > 0) {
      return NextResponse.json({
        success: true,
        predictions: live.map((p) => ({ ...p, id: `ml-${p.zoneId}`, source: "ML_MODEL" })),
      });
    }
  }

  const predictions = await db.zonePrediction.findMany({
    orderBy: { generatedAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ success: true, predictions });
}
