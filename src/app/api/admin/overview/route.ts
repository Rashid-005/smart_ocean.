import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [users, zones, reports, conversations] = await Promise.all([
    db.user.count(),
    db.fishingZone.count(),
    db.fishingReport.count(),
    db.aiConversation.count(),
  ]);

  const recentUsers = await db.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, fullName: true, phone: true, island: true, role: true, createdAt: true },
  });

  const allZones = await db.fishingZone.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, island: true, potential: true, safety: true, active: true },
  });

  return NextResponse.json({
    success: true,
    counts: { users, zones, reports, conversations },
    recentUsers,
    zones: allZones,
  });
}
