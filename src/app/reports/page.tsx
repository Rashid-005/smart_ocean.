"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGpsLocation } from "@/hooks/useGpsLocation";

type Zone = { id: string; name: string; distanceKm?: number };

function FishingReportInner() {
  const gps = useGpsLocation();
  const searchParams = useSearchParams();
  const initialZone = searchParams.get("zone") || "";

  const [zones, setZones] = useState<Zone[]>([]);
  const [weather, setWeather] = useState<string>("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    zoneId: initialZone,
    species: "",
    quantityKg: "",
    fuelUsedLiters: "",
    observations: "",
  });
  const [status, setStatus] = useState("");

  const hasFix = gps.status === "ready" && gps.latitude !== null && gps.longitude !== null;

  useEffect(() => {
    const load = async () => {
      const zonesUrl = hasFix
        ? `/api/fishing-zones/nearby?lat=${gps.latitude}&lon=${gps.longitude}`
        : "/api/fishing-zones";
      const [zonesRes, weatherRes] = await Promise.all([
        fetch(zonesUrl),
        fetch("/api/weather"),
      ]);
      const zonesData = await zonesRes.json();
      const weatherData = await weatherRes.json();
      const list: Zone[] = zonesData.zones ?? [];
      setZones(list);
      // Auto-select nearest zone if none is provided via URL
      if (list[0] && !form.zoneId) {
        setForm((f) => ({ ...f, zoneId: list[0].id }));
      }
      const w = weatherData.weather;
      if (w) setWeather(`${w.windSpeedKmh} km/h wind • ${w.waveHeightM} m waves • ${w.description}`);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFix, gps.latitude, gps.longitude]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Submitting...");
    const locationStamp = hasFix
      ? ` [Location ${(gps.latitude as number).toFixed(4)},${(gps.longitude as number).toFixed(4)} • ${weather}]`
      : "";
    const res = await fetch("/api/fishing-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: form.date,
        zoneId: form.zoneId,
        species: form.species,
        quantityKg: form.quantityKg ? Number(form.quantityKg) : undefined,
        fuelUsedLiters: form.fuelUsedLiters ? Number(form.fuelUsedLiters) : undefined,
        observations: form.observations
          ? `${form.observations}${locationStamp}`
          : locationStamp.replace(/^\s/, "") || undefined,
      }),
    });
    const data = await res.json();
    setStatus(res.ok ? `Saved report ${data.report?.id ?? ""}` : data.error || "Failed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-blue-900">New Fishing Report</h1>
        {hasFix && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
            Location attached
          </span>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 space-y-1">
        <p><span className="font-semibold">Date:</span> {form.date}</p>
        <p><span className="font-semibold">Your location:</span> {hasFix ? `${(gps.latitude as number).toFixed(4)}, ${(gps.longitude as number).toFixed(4)}` : "unavailable"}</p>
        <p><span className="font-semibold">Fishing zone:</span> {zones.find((z) => z.id === form.zoneId)?.name ?? (form.zoneId ? "loading..." : "nearest")}</p>
        <p><span className="font-semibold">Conditions:</span> {weather || "loading..."}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form className="space-y-6" onSubmit={submit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Date (auto)</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg outline-none" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Fishing Zone</label>
              <select value={form.zoneId} onChange={(e) => setForm({ ...form, zoneId: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}{z.distanceKm !== undefined ? ` • ${z.distanceKm.toFixed(1)} km` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Fish Species Caught</label>
              <input type="text" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Tuna, Sardines" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Catch Quantity (kg)</label>
              <input type="number" value={form.quantityKg} onChange={(e) => setForm({ ...form, quantityKg: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" min="0" step="0.1" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Fuel Used (L)</label>
              <input type="number" value={form.fuelUsedLiters} onChange={(e) => setForm({ ...form, fuelUsedLiters: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" min="0" step="0.1" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Observations</label>
            <textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-32" placeholder="Any special observations..." />
          </div>
          {status && <p className="text-sm text-gray-700">{status}</p>}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" className="px-8 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-700 transition font-medium">Submit Report</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FishingReport() {
  return (
    <Suspense fallback={<div className="text-blue-900">Loading form...</div>}>
      <FishingReportInner />
    </Suspense>
  );
}
