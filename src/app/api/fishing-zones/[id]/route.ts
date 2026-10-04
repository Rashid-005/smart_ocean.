import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const zone = await db.fishingZone.findUnique({
    where: { id: params.id },
    include: { predictions: { orderBy: { generatedAt: "desc" }, take: 5 } },
  });

  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

  const latest = zone.predictions[0];
  return NextResponse.json({
    success: true,
    zone: {
      id: zone.id,
      name: zone.name,
      island: zone.island,
      latitude: zone.latitude,
      longitude: zone.longitude,
      potential: latest?.potential ?? zone.potential,
      confidence: latest?.confidence ?? zone.confidence,
      species: latest?.species ?? [],
      recommendedTime: latest?.recommendedTime ?? zone.recommendedTime,
      safety: zone.safety,
    },
  });
}
