import { cookies } from "next/headers";

export type Island = "Unguja" | "Pemba";
export type Language = "en" | "sw";
export type UserRole = "fisherman" | "admin";

export type User = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  island: Island;
  password: string;
  language: Language;
  role: UserRole;
  createdAt: string;
};

export type Zone = {
  id: string;
  name: string;
  island: Island;
  latitude: number;
  longitude: number;
  potential: number;
  confidence: "High" | "Medium" | "Low";
  species: string[];
  recommendedTime: string;
  safety: "Safe" | "Caution" | "Dangerous";
  distanceKm?: number;
};

export type Prediction = {
  id: string;
  zoneId: string;
  potential: number;
  confidence: "High" | "Medium" | "Low";
  species: string[];
  recommendedTime: string;
  modelVersion: string;
  generatedAt: string;
};

export type WeatherSnapshot = {
  windSpeedKmh: number;
  waveHeightM: number;
  visibilityKm: number;
  temperatureC: number;
  description: string;
};

export type SafetyStatus = "SAFE" | "MODERATE" | "DANGEROUS";

export type FishingReport = {
  id: string;
  userId: string;
  date: string;
  zoneId: string;
  species: string;
  quantityKg?: number;
  fuelUsedLiters?: number;
  observations?: string;
  createdAt: string;
};

export const SESSION_COOKIE_NAME = "smart_ocean_session";

export const mockUsers: User[] = [
  {
    id: "user_demo_1",
    fullName: "Juma Doe",
    phone: "+255777123456",
    email: "juma@smartocean.app",
    island: "Unguja",
    password: "password123",
    language: "en",
    role: "fisherman",
    createdAt: "2026-10-01T08:30:00.000Z",
  },
];

export const mockZones: Zone[] = [
  {
    id: "zone-a",
    name: "Zone A",
    island: "Unguja",
    latitude: -6.10,
    longitude: 39.05,
    potential: 87,
    confidence: "High",
    species: ["Tuna", "Sardines"],
    recommendedTime: "06:00 - 10:00",
    safety: "Safe",
  },
  {
    id: "zone-b",
    name: "Zone B",
    island: "Unguja",
    latitude: -5.60,
    longitude: 39.30,
    potential: 64,
    confidence: "Medium",
    species: ["Kingfish"],
    recommendedTime: "05:30 - 09:30",
    safety: "Caution",
  },
  {
    id: "zone-c",
    name: "Zone C",
    island: "Unguja",
    latitude: -6.15,
    longitude: 39.65,
    potential: 51,
    confidence: "Low",
    species: ["Snapper"],
    recommendedTime: "16:00 - 19:00",
    safety: "Safe",
  },
  {
    id: "zone-d",
    name: "Zone D",
    island: "Unguja",
    latitude: -6.50,
    longitude: 39.40,
    potential: 39,
    confidence: "Low",
    species: ["Mackerel"],
    recommendedTime: "07:00 - 11:00",
    safety: "Dangerous",
  },
];

export const mockPredictions: Prediction[] = [
  {
    id: "pred-zone-a",
    zoneId: "zone-a",
    potential: 87,
    confidence: "High",
    species: ["Tuna", "Sardines"],
    recommendedTime: "06:00 - 10:00",
    modelVersion: "MVP_MOCK_v1",
    generatedAt: "2026-10-02T06:00:00.000Z",
  },
  {
    id: "pred-zone-b",
    zoneId: "zone-b",
    potential: 64,
    confidence: "Medium",
    species: ["Kingfish"],
    recommendedTime: "05:30 - 09:30",
    modelVersion: "MVP_MOCK_v1",
    generatedAt: "2026-10-02T06:00:00.000Z",
  },
];

export const mockWeather: WeatherSnapshot = {
  windSpeedKmh: 12,
  waveHeightM: 0.8,
  visibilityKm: 10,
  temperatureC: 27,
  description: "Clear with light breeze",
};

export const mockReports: FishingReport[] = [
  {
    id: "report_1",
    userId: "user_demo_1",
    date: "2026-10-01",
    zoneId: "zone-a",
    species: "Tuna, Sardines",
    quantityKg: 42,
    fuelUsedLiters: 18,
    observations: "Good conditions with calm seas in the early morning.",
    createdAt: "2026-10-01T09:30:00.000Z",
  },
];

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    email: user.email,
    island: user.island,
    language: user.language,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function getCurrentUser() {
  const sessionValue = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!sessionValue) {
    return null;
  }

  return mockUsers.find((user) => user.id === sessionValue) ?? null;
}

export function setSession(userId: string) {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: userId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE_NAME);
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function getSafetyStatus(): SafetyStatus {
  if (mockWeather.windSpeedKmh > 25 || mockWeather.waveHeightM > 2.2) {
    return "DANGEROUS";
  }

  if (mockWeather.windSpeedKmh > 15 || mockWeather.waveHeightM > 1.4) {
    return "MODERATE";
  }

  return "SAFE";
}
