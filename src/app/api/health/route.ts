import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { mlHealth } from "@/lib/services/ml-client";

export async function GET() {
  let database: string = "ok";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }

  const ml = await mlHealth();

  const healthy = database === "ok";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database,
      ml: ml.ok ? "ok" : "unreachable",
      mlModelVersion: ml.modelVersion ?? null,
      app: "smart-ocean-next",
    },
    { status: healthy ? 200 : 503 },
  );
}
