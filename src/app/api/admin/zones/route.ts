import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { adminZoneCreateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = adminZoneCreateSchema.parse(body);

    const zone = await db.fishingZone.create({
      data: {
        name: parsed.name,
        island: parsed.island,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        geomWkt: `POINT(${parsed.longitude} ${parsed.latitude})`,
        potential: parsed.potential,
        confidence: parsed.confidence,
        recommendedTime: parsed.recommendedTime,
        safety: parsed.safety,
        active: true,
      },
    });

    return NextResponse.json({ success: true, zone }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
