import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Demo user (mirrors src/lib/mock-backend.ts)
  const passwordHash = await bcrypt.hash("password123", 10);

  const demoUser = await prisma.user.upsert({
    where: { phone: "+255777123456" },
    update: {},
    create: {
      fullName: "Juma Doe",
      phone: "+255777123456",
      email: "juma@smartocean.app",
      island: "Unguja",
      password: passwordHash,
      language: "en",
      role: "FISHERMAN",
    },
  });

  await prisma.fisherman.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      island: "Unguja",
      boatName: "Demo Boat",
      boatType: "Dhow",
    },
  });

  // Unguja demo zones A/B/C/D in the sea
  const zones = [
    {
      name: "Zone A",
      island: "Unguja",
      latitude: -6.10,
      longitude: 39.05,
      potential: 87,
      confidence: "HIGH" as const,
      species: ["Tuna", "Sardines"],
      recommendedTime: "06:00 - 10:00",
      safety: "SAFE" as const,
    },
    {
      name: "Zone B",
      island: "Unguja",
      latitude: -5.60,
      longitude: 39.30,
      potential: 64,
      confidence: "MEDIUM" as const,
      species: ["Kingfish"],
      recommendedTime: "05:30 - 09:30",
      safety: "MODERATE" as const,
    },
    {
      name: "Zone C",
      island: "Unguja",
      latitude: -6.15,
      longitude: 39.65,
      potential: 51,
      confidence: "LOW" as const,
      species: ["Snapper"],
      recommendedTime: "16:00 - 19:00",
      safety: "SAFE" as const,
    },
    {
      name: "Zone D",
      island: "Unguja",
      latitude: -6.50,
      longitude: 39.40,
      potential: 39,
      confidence: "LOW" as const,
      species: ["Mackerel"],
      recommendedTime: "07:00 - 11:00",
      safety: "DANGEROUS" as const,
    },
  ];

  for (const z of zones) {
    const zone = await prisma.fishingZone.upsert({
      where: { name: z.name },
      update: {
        island: z.island,
        latitude: z.latitude,
        longitude: z.longitude,
        geomWkt: `POINT(${z.longitude} ${z.latitude})`,
        potential: z.potential,
        confidence: z.confidence,
        recommendedTime: z.recommendedTime,
        safety: z.safety,
        active: true,
      },
      create: {
        name: z.name,
        island: z.island,
        latitude: z.latitude,
        longitude: z.longitude,
        geomWkt: `POINT(${z.longitude} ${z.latitude})`,
        potential: z.potential,
        confidence: z.confidence,
        recommendedTime: z.recommendedTime,
        safety: z.safety,
        active: true,
      },
    });

    await prisma.zonePrediction.create({
      data: {
        zoneId: zone.id,
        potential: z.potential,
        confidence: z.confidence,
        species: z.species,
        recommendedTime: z.recommendedTime,
        modelVersion: "MVP_MOCK_v1",
      },
    });
  }

  await prisma.weatherData.create({
    data: {
      windSpeedKmh: 12,
      waveHeightM: 0.8,
      visibilityKm: 10,
      temperatureC: 27,
      description: "Clear with light breeze",
      safetyStatus: "SAFE",
      source: "MOCK",
    },
  });

  await prisma.oceanCondition.create({
    data: {
      windSpeedKmh: 12,
      waveHeightM: 0.8,
      visibilityKm: 10,
      temperatureC: 27,
      description: "Clear with light breeze",
      safetyStatus: "SAFE",
      source: "MOCK",
    },
  });

  await prisma.mlModel.upsert({
    where: { version: "MVP_MOCK_v1" },
    update: { active: true },
    create: { version: "MVP_MOCK_v1", active: true, notes: "Controlled mock predictions for MVP" },
  });

  await prisma.systemSetting.upsert({
    where: { key: "safety thresholds" },
    update: {},
    create: { key: "safety thresholds", value: JSON.stringify({ moderateWind: 15, dangerousWind: 25 }) },
  });

  const zoneA = await prisma.fishingZone.findUnique({ where: { name: "Zone A" } });
  if (zoneA) {
    const existing = await prisma.fishingReport.findFirst({
      where: { userId: demoUser.id, zoneId: zoneA.id },
    });
    if (!existing) {
      await prisma.fishingReport.create({
        data: {
          userId: demoUser.id,
          zoneId: zoneA.id,
          date: new Date("2026-10-01"),
          species: "Tuna, Sardines",
          quantityKg: 42,
          fuelUsedLiters: 18,
          observations: "Good conditions with calm seas in the early morning.",
          reportSpecies: {
            create: [{ name: "Tuna" }, { name: "Sardines" }],
          },
        },
      });
    }
  }

  console.log("Seed complete: demo user + zones A-D + predictions + weather/ocean + ml model");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
