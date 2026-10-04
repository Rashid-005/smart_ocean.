import { db } from "@/lib/db";

export type SafetyStatus = "SAFE" | "MODERATE" | "DANGEROUS";

export type SafetyThresholds = {
  moderateWind: number;
  dangerousWind: number;
  moderateWave: number;
  dangerousWave: number;
  moderateVisibility: number;
  dangerousVisibility: number;
};

export const DEFAULT_THRESHOLDS: SafetyThresholds = {
  moderateWind: 15,
  dangerousWind: 25,
  moderateWave: 1.4,
  dangerousWave: 2.2,
  moderateVisibility: 5,
  dangerousVisibility: 2,
};

export type SafetyInputs = {
  windSpeedKmh: number;
  waveHeightM: number;
  visibilityKm: number;
  temperatureC: number;
  description: string;
};

export async function getSafetyThresholds(): Promise<SafetyThresholds> {
  try {
    const row = await db.systemSetting.findUnique({ where: { key: "safety thresholds" } });
    if (!row) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(row.value) as Partial<SafetyThresholds>;
    return { ...DEFAULT_THRESHOLDS, ...parsed };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

// Worst-factor-wins: any DANGEROUS factor → DANGEROUS, else any MODERATE → MODERATE.
export function evaluateSafety(inputs: SafetyInputs, t: SafetyThresholds = DEFAULT_THRESHOLDS) {
  const factors = {
    wind:
      inputs.windSpeedKmh > t.dangerousWind
        ? ("DANGEROUS" as const)
        : inputs.windSpeedKmh > t.moderateWind
          ? ("MODERATE" as const)
          : ("SAFE" as const),
    waves:
      inputs.waveHeightM > t.dangerousWave
        ? ("DANGEROUS" as const)
        : inputs.waveHeightM > t.moderateWave
          ? ("MODERATE" as const)
          : ("SAFE" as const),
    visibility:
      inputs.visibilityKm < t.dangerousVisibility
        ? ("DANGEROUS" as const)
        : inputs.visibilityKm < t.moderateVisibility
          ? ("MODERATE" as const)
          : ("SAFE" as const),
  };

  const status: SafetyStatus = Object.values(factors).includes("DANGEROUS")
    ? "DANGEROUS"
    : Object.values(factors).includes("MODERATE")
      ? "MODERATE"
      : "SAFE";

  const reasons: string[] = [];
  if (factors.wind !== "SAFE")
    reasons.push(`Wind ${inputs.windSpeedKmh} km/h → ${factors.wind}`);
  if (factors.waves !== "SAFE")
    reasons.push(`Waves ${inputs.waveHeightM} m → ${factors.waves}`);
  if (factors.visibility !== "SAFE")
    reasons.push(`Visibility ${inputs.visibilityKm} km → ${factors.visibility}`);
  if (reasons.length === 0) reasons.push("All factors within safe limits");

  return { status, factors, reasons, thresholds: t };
}
