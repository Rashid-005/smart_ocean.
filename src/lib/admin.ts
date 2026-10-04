import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/auth";

export async function requireAdmin() {
  const user = await getCurrentDbUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse };
  }
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 }) as NextResponse };
  }
  return { user };
}
