import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import { evaluateSafety, getSafetyThresholds } from "@/lib/safety";
import { safetyInputSchema } from "@/lib/validators";
import { getLatestWeather } from "@/lib/zones";

export async function GET() {
  const weather = await getLatestWeather();
  const thresholds = await getSafetyThresholds();
  const result = evaluateSafety(
    {
      windSpeedKmh: weather.windSpeedKmh,
      waveHeightM: weather.waveHeightM,
      visibilityKm: weather.visibilityKm,
      temperatureC: weather.temperatureC,
      description: weather.description,
    },
    thresholds,
  );

  const recent = await db.oceanCondition.findMany({
    orderBy: { timestamp: "desc" },
    take: 5,
  });

  // The internal data-origin label is never exposed to users.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { source, ...weatherOut } = weather;
  const recentOut = recent.map(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ({ source, ...r }) => r,
  );

  return NextResponse.json({
    success: true,
    status: result.status,
    weather: weatherOut,
    factors: result.factors,
    reasons: result.reasons,
    thresholds: result.thresholds,
    recent: recentOut,
  });
}

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit(rateLimitKey(request, "safety-post", user.id), 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = safetyInputSchema.parse(body);
    const thresholds = await getSafetyThresholds();
    const result = evaluateSafety(
      {
        windSpeedKmh: parsed.windSpeedKmh,
        waveHeightM: parsed.waveHeightM,
        visibilityKm: parsed.visibilityKm,
        temperatureC: parsed.temperatureC,
        description: parsed.description,
      },
      thresholds,
    );

    const [ocean, weather] = await Promise.all([
      db.oceanCondition.create({
        data: {
          windSpeedKmh: parsed.windSpeedKmh,
          waveHeightM: parsed.waveHeightM,
          visibilityKm: parsed.visibilityKm,
          temperatureC: parsed.temperatureC,
          description: parsed.description,
          safetyStatus: result.status,
          source: "observed",
        },
      }),
      db.weatherData.create({
        data: {
          windSpeedKmh: parsed.windSpeedKmh,
          waveHeightM: parsed.waveHeightM,
          visibilityKm: parsed.visibilityKm,
          temperatureC: parsed.temperatureC,
          description: parsed.description,
          safetyStatus: result.status,
          source: "observed",
        },
      }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { source: _o, ...oceanOut } = ocean;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { source: _w, ...weatherOut } = weather;

    return NextResponse.json(
      {
        success: true,
        status: result.status,
        factors: result.factors,
        reasons: result.reasons,
        thresholds: result.thresholds,
        ocean: oceanOut,
        weather: weatherOut,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
