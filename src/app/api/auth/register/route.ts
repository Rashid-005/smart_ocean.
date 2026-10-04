import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { sanitizeUser, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const rl = checkRateLimit(rateLimitKey(request, "auth-register"), 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);

    const email = parsed.email?.trim() ? parsed.email.trim() : null;

    const existing = await db.user.findFirst({
      where: {
        OR: [
          { phone: parsed.phone },
          ...(email ? [{ email } as const] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with that phone or email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const newUser = await db.user.create({
      data: {
        fullName: parsed.fullName,
        phone: parsed.phone,
        email,
        island: parsed.island,
        password: passwordHash,
        language: parsed.language ?? "en",
        role: "FISHERMAN",
      },
    });

    await db.fisherman.create({
      data: { userId: newUser.id, island: parsed.island },
    });

    setSession(newUser.id);

    return NextResponse.json({ success: true, user: sanitizeUser(newUser) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
