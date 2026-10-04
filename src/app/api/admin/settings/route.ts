import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { DEFAULT_THRESHOLDS } from "@/lib/safety";
import { adminThresholdsSchema } from "@/lib/validators";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const row = await db.systemSetting.findUnique({ where: { key: "safety thresholds" } });
  const thresholds = row ? { ...DEFAULT_THRESHOLDS, ...JSON.parse(row.value) } : DEFAULT_THRESHOLDS;
  return NextResponse.json({ success: true, thresholds });
}

export async function PATCH(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = adminThresholdsSchema.parse(body);

    if (parsed.moderateWind >= parsed.dangerousWind || parsed.moderateWave >= parsed.dangerousWave) {
      return NextResponse.json({ error: "Moderate thresholds must be below dangerous thresholds" }, { status: 400 });
    }

    const row = await db.systemSetting.upsert({
      where: { key: "safety thresholds" },
      update: { value: JSON.stringify(parsed) },
      create: { key: "safety thresholds", value: JSON.stringify(parsed) },
    });

    return NextResponse.json({ success: true, thresholds: JSON.parse(row.value) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
