import { NextResponse } from "next/server";

import { getCurrentDbUser, sanitizeUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profileUpdateSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: sanitizeUser(user) });
}

export async function PATCH(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = profileUpdateSchema.parse(body);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(parsed.fullName ? { fullName: parsed.fullName } : {}),
        ...(parsed.phone ? { phone: parsed.phone } : {}),
        ...(parsed.email !== undefined
          ? { email: parsed.email ? parsed.email : null }
          : {}),
        ...(parsed.language ? { language: parsed.language } : {}),
        ...(parsed.island ? { island: parsed.island } : {}),
      },
    });

    return NextResponse.json({ success: true, user: sanitizeUser(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
