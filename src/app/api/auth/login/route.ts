import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { sanitizeUser, setSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const rl = checkRateLimit(rateLimitKey(request, "auth-login"), 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many attempts, try again later" }, { status: 429 });
  }
  try {
    const body = await request.json();
    const parsed = loginSchema.parse(body);

    const user = await db.user.findFirst({
      where: {
        OR: [{ phone: parsed.identifier }, { email: parsed.identifier }],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid phone/email or password" }, { status: 401 });
    }

    const ok = await bcrypt.compare(parsed.password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Invalid phone/email or password" }, { status: 401 });
    }

    setSession(user.id);

    return NextResponse.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
