import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { adminUserUpdateSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { error, user: admin } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = adminUserUpdateSchema.parse(body);

    // Prevent demoting yourself out of admin.
    if (admin!.id === params.id && parsed.role === "FISHERMAN") {
      return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: params.id },
      data: parsed,
    });

    return NextResponse.json({ success: true, user: { id: user.id, role: user.role, island: user.island } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 },
    );
  }
}
