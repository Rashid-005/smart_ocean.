-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FISHERMAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "SafetyStatus" AS ENUM ('SAFE', 'MODERATE', 'DANGEROUS');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "island" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "role" "Role" NOT NULL DEFAULT 'FISHERMAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishermen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "island" TEXT NOT NULL,
    "boatName" TEXT,
    "boatType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishermen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "island" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geomWkt" TEXT,
    "potential" INTEGER NOT NULL DEFAULT 0,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
    "recommendedTime" TEXT NOT NULL DEFAULT '06:00 - 10:00',
    "safety" "SafetyStatus" NOT NULL DEFAULT 'SAFE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishing_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_predictions" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "potential" INTEGER NOT NULL,
    "confidence" "ConfidenceLevel" NOT NULL,
    "species" TEXT[],
    "recommendedTime" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zone_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocean_conditions" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windSpeedKmh" DOUBLE PRECISION NOT NULL,
    "waveHeightM" DOUBLE PRECISION NOT NULL,
    "visibilityKm" DOUBLE PRECISION NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "safetyStatus" "SafetyStatus" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MOCK',

    CONSTRAINT "ocean_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_data" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windSpeedKmh" DOUBLE PRECISION NOT NULL,
    "waveHeightM" DOUBLE PRECISION NOT NULL,
    "visibilityKm" DOUBLE PRECISION NOT NULL,
    "temperatureC" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "safetyStatus" "SafetyStatus" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MOCK',

    CONSTRAINT "weather_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "geomWkt" TEXT,
    "accuracy" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'demo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "species" TEXT NOT NULL,
    "quantityKg" DOUBLE PRECISION,
    "fuelUsedLiters" DOUBLE PRECISION,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fishing_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fishing_report_species" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,

    CONSTRAINT "fishing_report_species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ml_models" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ml_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_island_idx" ON "users"("island");

-- CreateIndex
CREATE UNIQUE INDEX "fishermen_userId_key" ON "fishermen"("userId");

-- CreateIndex
CREATE INDEX "fishermen_island_idx" ON "fishermen"("island");

-- CreateIndex
CREATE UNIQUE INDEX "fishing_zones_name_key" ON "fishing_zones"("name");

-- CreateIndex
CREATE INDEX "fishing_zones_island_idx" ON "fishing_zones"("island");

-- CreateIndex
CREATE INDEX "fishing_zones_latitude_longitude_idx" ON "fishing_zones"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "zone_predictions_zoneId_idx" ON "zone_predictions"("zoneId");

-- CreateIndex
CREATE INDEX "zone_predictions_modelVersion_idx" ON "zone_predictions"("modelVersion");

-- CreateIndex
CREATE INDEX "ocean_conditions_timestamp_idx" ON "ocean_conditions"("timestamp");

-- CreateIndex
CREATE INDEX "weather_data_timestamp_idx" ON "weather_data"("timestamp");

-- CreateIndex
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "fishing_reports_userId_idx" ON "fishing_reports"("userId");

-- CreateIndex
CREATE INDEX "fishing_reports_zoneId_idx" ON "fishing_reports"("zoneId");

-- CreateIndex
CREATE INDEX "fishing_report_species_reportId_idx" ON "fishing_report_species"("reportId");

-- CreateIndex
CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "ml_models_version_key" ON "ml_models"("version");

-- AddForeignKey
ALTER TABLE "fishermen" ADD CONSTRAINT "fishermen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_predictions" ADD CONSTRAINT "zone_predictions_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "fishing_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fishing_reports" ADD CONSTRAINT "fishing_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fishing_reports" ADD CONSTRAINT "fishing_reports_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "fishing_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fishing_report_species" ADD CONSTRAINT "fishing_report_species_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "fishing_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
