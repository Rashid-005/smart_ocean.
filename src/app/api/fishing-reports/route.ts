import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await db.fishingReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { zone: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ success: true, reports });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = reportSchema.parse(body);

    const zone = await db.fishingZone.findUnique({ where: { id: parsed.zoneId } });
    if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

    const speciesList = parsed.species
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const report = await db.fishingReport.create({
      data: {
        userId: user.id,
        zoneId: parsed.zoneId,
        date: new Date(parsed.date),
        species: parsed.species,
        quantityKg: parsed.quantityKg ?? 0,
        fuelUsedLiters: parsed.fuelUsedLiters ?? 0,
        observations: parsed.observations ?? "",
        reportSpecies: {
          create: speciesList.map((name) => ({ name })),
        },
      },
      include: { reportSpecies: true },
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
