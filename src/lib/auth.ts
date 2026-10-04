import { cookies } from "next/headers";

import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "smart_ocean_session";

export function sanitizeUser(user: {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  island: string;
  language: string;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    island: user.island,
    language: user.language,
    role: user.role.toLowerCase(),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function getCurrentDbUser() {
  const sessionValue = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!sessionValue) return null;
  const user = await db.user.findUnique({ where: { id: sessionValue } });
  return user;
}

export function setSession(userId: string) {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: userId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Hardened: Secure in production unless explicitly allowed for http localhost.
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_COOKIES !== "1",
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}
