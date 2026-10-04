import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, fullName: true, phone: true, email: true, island: true, role: true, createdAt: true },
  });

  return NextResponse.json({ success: true, users });
}
