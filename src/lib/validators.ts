import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().min(8, "Phone number is required"),
  email: z.string().trim().email("Valid email is required").optional().or(z.literal("")),
  island: z.enum(["Unguja", "Pemba"]),
  password: z.string().min(6, "Password must be at least 6 characters"),
  language: z.enum(["en", "sw"]).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Phone or email is required"),
  password: z.string().min(6, "Password is required"),
});

export const profileUpdateSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().min(8).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  language: z.enum(["en", "sw"]).optional(),
  island: z.enum(["Unguja", "Pemba"]).optional(),
});

export const reportSchema = z.object({
  date: z.string().min(1),
  zoneId: z.string().min(1),
  species: z.string().min(1),
  quantityKg: z.number().min(0).optional(),
  fuelUsedLiters: z.number().min(0).optional(),
  observations: z.string().optional(),
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
  conversationId: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const safetyInputSchema = z.object({
  windSpeedKmh: z.number().min(0).max(200),
  waveHeightM: z.number().min(0).max(30),
  visibilityKm: z.number().min(0).max(100).optional().default(10),
  temperatureC: z.number().min(-10).max(60).optional().default(27),
  description: z.string().max(280).optional().default("Manual reading"),
});

export const adminZoneCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  island: z.enum(["Unguja", "Pemba"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  potential: z.number().int().min(0).max(100).default(50),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).default("LOW"),
  recommendedTime: z.string().min(1).max(40).default("06:00 - 10:00"),
  safety: z.enum(["SAFE", "MODERATE", "DANGEROUS"]).default("SAFE"),
});

export const adminZoneUpdateSchema = z.object({
  potential: z.number().int().min(0).max(100).optional(),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  safety: z.enum(["SAFE", "MODERATE", "DANGEROUS"]).optional(),
  recommendedTime: z.string().min(1).max(40).optional(),
  active: z.boolean().optional(),
});

export const adminUserUpdateSchema = z.object({
  role: z.enum(["FISHERMAN", "ADMIN"]).optional(),
  island: z.enum(["Unguja", "Pemba"]).optional(),
});

export const adminThresholdsSchema = z.object({
  moderateWind: z.number().min(0).max(100),
  dangerousWind: z.number().min(0).max(200),
  moderateWave: z.number().min(0).max(20),
  dangerousWave: z.number().min(0).max(30),
  moderateVisibility: z.number().min(0).max(50),
  dangerousVisibility: z.number().min(0).max(50),
});
