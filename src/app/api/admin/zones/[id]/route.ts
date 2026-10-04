import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { adminZoneUpdateSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = adminZoneUpdateSchema.parse(body);

    const zone = await db.fishingZone.update({
      where: { id: params.id },
      data: parsed,
    });

    return NextResponse.json({ success: true, zone });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
