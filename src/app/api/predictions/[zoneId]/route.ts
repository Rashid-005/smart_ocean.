import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isMlConfigured, mlPredictForZone } from "@/lib/services/ml-client";

export async function GET(
  _request: Request,
  { params }: { params: { zoneId: string } },
) {
  const zone = await db.fishingZone.findUnique({ where: { id: params.zoneId } });
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  if (isMlConfigured()) {
    const ml = await mlPredictForZone(zone.id, zone.name);
    if (ml) {
      return NextResponse.json({
        success: true,
        zone,
        prediction: { ...ml, id: `ml-${zone.id}`, source: "ML_MODEL" },
      });
    }
  }

  const prediction = await db.zonePrediction.findFirst({
    where: { zoneId: params.zoneId },
    orderBy: { generatedAt: "desc" },
  });

  if (!prediction)
    return NextResponse.json({ error: "Prediction not found" }, { status: 404 });

  return NextResponse.json({ success: true, zone, prediction });
}
