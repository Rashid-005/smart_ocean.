import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await db.fishingReport.findFirst({
    where: { id: params.id, userId: user.id },
    include: { zone: true, reportSpecies: true },
  });

  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
  return NextResponse.json({ success: true, report });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.fishingReport.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  try {
    const body = await request.json();
    const parsed = reportSchema.parse(body);

    const updated = await db.fishingReport.update({
      where: { id: params.id },
      data: {
        date: new Date(parsed.date),
        zoneId: parsed.zoneId,
        species: parsed.species,
        quantityKg: parsed.quantityKg ?? existing.quantityKg,
        fuelUsedLiters: parsed.fuelUsedLiters ?? existing.fuelUsedLiters,
        observations: parsed.observations ?? existing.observations,
      },
    });

    return NextResponse.json({ success: true, report: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.fishingReport.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  await db.fishingReport.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true, message: "Report deleted successfully" });
}
