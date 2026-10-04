import { NextResponse } from "next/server";

import { getCurrentDbUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, rateLimitKey } from "@/lib/rate-limit";
import {
  respondToMessage,
  type AssistantContext,
  type HistoryMessage,
} from "@/lib/ai-assistant";
import { haversineDistanceKm } from "@/lib/geo";
import { isSupportedArea } from "@/lib/location";
import { evaluateSafety, getSafetyThresholds } from "@/lib/safety";
import { getLatestWeather, getZonesWithPredictions } from "@/lib/zones";
import { aiChatSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentDbUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit(rateLimitKey(request, "ai-chat", user.id), 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many AI requests, slow down" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = aiChatSchema.parse(body);

    let conversationId = parsed.conversationId;
    if (conversationId) {
      const existing = await db.aiConversation.findFirst({
        where: { id: conversationId, userId: user.id },
      });
      if (!existing)
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    } else {
      const convo = await db.aiConversation.create({
        data: { userId: user.id, title: parsed.message.slice(0, 60) },
      });
      conversationId = convo.id;
    }

    await db.aiMessage.create({
      data: { conversationId, sender: "user", content: parsed.message },
    });

    // Conversation history for follow-up understanding (previous turns only).
    const priorMessages = await db.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 11,
    });
    const history: HistoryMessage[] = priorMessages
      .reverse()
      .slice(0, -1)
      .map((m) => ({ sender: m.sender === "user" ? "user" : "assistant", content: m.content }));

    const weather = await getLatestWeather();
    const thresholds = await getSafetyThresholds();
    const safety = evaluateSafety(
      {
        windSpeedKmh: weather.windSpeedKmh,
        waveHeightM: weather.waveHeightM,
        visibilityKm: weather.visibilityKm,
        temperatureC: weather.temperatureC,
        description: weather.description,
      },
      thresholds,
    );

    const zonesRaw = await getZonesWithPredictions();
    const hasLocation =
      typeof parsed.latitude === "number" && typeof parsed.longitude === "number";
    const outsideArea = hasLocation
      ? !isSupportedArea(parsed.latitude as number, parsed.longitude as number)
      : false;

    const zones = zonesRaw.map((z) => ({
      id: z.id,
      name: z.name,
      island: z.island,
      latitude: z.latitude,
      longitude: z.longitude,
      potential: z.potential,
      confidence: z.confidence,
      species: z.species,
      recommendedTime: z.recommendedTime,
      safety: z.safety,
      distanceKm: hasLocation
        ? haversineDistanceKm(
            parsed.latitude as number,
            parsed.longitude as number,
            z.latitude,
            z.longitude,
          )
        : null,
    }));

    const recentReportRows = await db.fishingReport.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { zone: { select: { name: true } } },
    });
    const reportCount = await db.fishingReport.count({ where: { userId: user.id } });

    const context: AssistantContext = {
      language: user.language === "sw" ? "sw" : "en",
      hasLocation,
      outsideArea,
      zones,
      safetyStatus: safety.status,
      weather: {
        windSpeedKmh: weather.windSpeedKmh,
        waveHeightM: weather.waveHeightM,
        visibilityKm: weather.visibilityKm,
        temperatureC: weather.temperatureC,
        description: weather.description,
      },
      reportCount,
      recentReports: recentReportRows.map((r) => ({
        date: r.date.toISOString(),
        zoneName: r.zone.name,
        species: r.species,
        quantityKg: r.quantityKg,
      })),
      boatSpeedKmh: 20,
      fuelConsumptionLpk: 1.5,
    };

    const reply = respondToMessage(parsed.message, context, history);
    const assistantMsg = await db.aiMessage.create({
      data: { conversationId, sender: "assistant", content: reply },
    });

    return NextResponse.json({
      success: true,
      conversationId,
      message: assistantMsg,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }
}
