"use client";

import { useEffect, useState } from "react";

import { useGpsLocation } from "@/hooks/useGpsLocation";

type PredictionData = {
  zoneId: string;
  potential: number;
  confidence: string;
  species: string[];
  recommendedTime: string;
};

type ZoneData = {
  id: string;
  name: string;
  island: string;
  potential: number;
  distanceKm?: number;
};

type SafetyData = {
  status: "SAFE" | "MODERATE" | "DANGEROUS";
  weather: {
    windSpeedKmh: number;
    waveHeightM: number;
    visibilityKm: number;
    temperatureC: number;
    description: string;
  };
};

export default function Dashboard() {
  const gps = useGpsLocation();
  const hasFix = gps.status === "ready" && gps.latitude !== null && gps.longitude !== null;
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [safety, setSafety] = useState<SafetyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const zoneUrl = hasFix
          ? `/api/fishing-zones?lat=${gps.latitude}&lon=${gps.longitude}`
          : "/api/fishing-zones";
        const [zonesRes, predictionRes, safetyRes] = await Promise.all([
          fetch(zoneUrl),
          fetch("/api/predictions"),
          fetch("/api/ocean-safety"),
        ]);

        const [zonesData, predictionData, safetyData] = await Promise.all([
          zonesRes.json(),
          predictionRes.json(),
          safetyRes.json(),
        ]);

        const list: ZoneData[] = zonesData.zones ?? [];
        setZones(list);
        const top = list[0];
        const preds: PredictionData[] = predictionData.predictions ?? [];
        setPrediction(
          (top && preds.find((p) => p.zoneId === top.id)) ?? preds[0] ?? null,
        );
        setSafety(safetyData ?? null);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, [hasFix, gps.latitude, gps.longitude]);

  if (loading) {
    return <div className="text-blue-900">Loading dashboard...</div>;
  }

  const topZone = zones[0] ?? null;
  const distanceKm = topZone?.distanceKm ?? null;
  const etaMin = distanceKm !== null ? Math.max(1, Math.round((distanceKm / 20) * 60)) : null;

  const safetyTone =
    safety?.status === "SAFE"
      ? "bg-green-50 text-green-700 border-green-200"
      : safety?.status === "MODERATE"
        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Welcome, Fisherman</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Current Location</h3>
          {hasFix ? (
            <>
              <p className="text-xl font-bold mt-2">Latitude: {(gps.latitude as number).toFixed(4)}</p>
              <p className="text-xl font-bold">Longitude: {(gps.longitude as number).toFixed(4)}</p>
            </>
          ) : (
            <p className="text-lg font-semibold mt-2 text-gray-500">Location unavailable</p>
          )}
        </div>

        <div className={`p-6 rounded-xl shadow-sm border ${safetyTone}`}>
          <h3 className="font-medium">Ocean Safety</h3>
          <p className="text-2xl font-bold mt-2">{safety?.status ?? "—"}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-gray-500 font-medium">Recommended Zone</h3>
            <p className="text-2xl font-bold mt-2 text-blue-900">{topZone?.name ?? "—"}</p>
          </div>
          {topZone && (
            <a href={`/map?destination=${topZone.id}`} className="mt-4 text-blue-600 font-semibold hover:underline text-sm flex items-center gap-1">
              Choose Zone <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </a>
          )}
        </div>

        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
          <h3 className="text-blue-800 font-medium">Fishing Potential</h3>
          <p className="text-2xl font-bold mt-2 text-blue-900">
            {prediction ? `${prediction.potential}%` : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-900">Today's Recommended Fishing</h2>
          {topZone && (
            <a href={`/map?destination=${topZone.id}`} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg text-sm transition">
              View Route
            </a>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Expected Species</p>
            <p className="font-semibold">{prediction?.species?.join(" + ") ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Recommended Time</p>
            <p className="font-semibold">{prediction?.recommendedTime ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Distance</p>
            <p className="font-semibold">{distanceKm !== null ? `${distanceKm.toFixed(1)} km` : "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ETA</p>
            <p className="font-semibold">{etaMin !== null ? `${etaMin} min` : "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
