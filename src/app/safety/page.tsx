"use client";

import { useEffect, useState } from "react";

type SafetyData = {
  status: "SAFE" | "MODERATE" | "DANGEROUS";
  weather: {
    windSpeedKmh: number;
    waveHeightM: number;
    visibilityKm: number;
    temperatureC: number;
    description: string;
  };
  factors?: { wind: string; waves: string; visibility: string };
  reasons?: string[];
  thresholds?: {
    moderateWind: number;
    dangerousWind: number;
    moderateWave: number;
    dangerousWave: number;
    moderateVisibility: number;
    dangerousVisibility: number;
  };
  source?: string;
};

export default function OceanSafety() {
  const [safety, setSafety] = useState<SafetyData | null>(null);
  const [form, setForm] = useState({ wind: "12", wave: "0.8", vis: "10", temp: "27" });
  const [msg, setMsg] = useState("");

  const load = async () => {
    const response = await fetch("/api/ocean-safety");
    const data = await response.json();
    setSafety(data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Saving...");
    const res = await fetch("/api/ocean-safety", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        windSpeedKmh: Number(form.wind),
        waveHeightM: Number(form.wave),
        visibilityKm: Number(form.vis),
        temperatureC: Number(form.temp),
        description: "Manual reading",
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Saved → ${data.status}` : data.error || "Failed");
    if (res.ok) load();
  };

  const tone =
    safety?.status === "SAFE"
      ? "bg-green-50 border-green-200 text-green-800"
      : safety?.status === "MODERATE"
        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
        : "bg-red-50 border-red-200 text-red-800";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Ocean Safety</h1>

      <div className={`p-8 rounded-xl shadow-sm border text-center space-y-4 ${tone}`}>
        <div className="w-20 h-20 bg-white/60 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h2 className="text-3xl font-bold">{safety?.status ?? "SAFE"}</h2>
        <p className="max-w-md mx-auto">{safety?.weather?.description ?? "Conditions are currently suitable for fishing according to available safety data."}</p>
        {safety?.reasons && (
          <div className="text-sm max-w-md mx-auto space-y-1">
            {safety.reasons.map((r, i) => (
              <p key={i}>• {r}</p>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Wind Speed</h3>
          <p className="text-2xl font-bold mt-2">{safety?.weather?.windSpeedKmh ?? 12} km/h</p>
          <p className="text-sm text-gray-400 mt-1">
            {safety?.factors ? `Factor: ${safety.factors.wind}` : safety?.weather?.description ?? "Light breeze"}
          </p>
          {safety?.thresholds && (
            <p className="text-xs text-gray-400 mt-1">Moderate &gt;{safety.thresholds.moderateWind} • Dangerous &gt;{safety.thresholds.dangerousWind}</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Wave Height</h3>
          <p className="text-2xl font-bold mt-2">{safety?.weather?.waveHeightM ?? 0.8} m</p>
          <p className="text-sm text-gray-400 mt-1">{safety?.factors ? `Factor: ${safety.factors.waves}` : "Calm"}</p>
          {safety?.thresholds && (
            <p className="text-xs text-gray-400 mt-1">Moderate &gt;{safety.thresholds.moderateWave}m • Dangerous &gt;{safety.thresholds.dangerousWave}m</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-medium">Visibility</h3>
          <p className="text-2xl font-bold mt-2">{safety?.weather?.visibilityKm ?? 10} km</p>
          <p className="text-sm text-gray-400 mt-1">{safety?.factors ? `Factor: ${safety.factors.visibility}` : "Clear"}</p>
          {safety?.thresholds && (
            <p className="text-xs text-gray-400 mt-1">Moderate &lt;{safety.thresholds.moderateVisibility}km • Dangerous &lt;{safety.thresholds.dangerousVisibility}km</p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="font-bold text-blue-900 mb-1">Update conditions</h2>
        <p className="text-sm text-gray-500 mb-4">Record the wind, waves and visibility you observe. The safety result updates immediately.</p>
        <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="text-sm">Wind km/h<input type="number" step="0.1" min="0" value={form.wind} onChange={(e) => setForm({ ...form, wind: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
          <label className="text-sm">Waves m<input type="number" step="0.1" min="0" value={form.wave} onChange={(e) => setForm({ ...form, wave: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
          <label className="text-sm">Vis km<input type="number" step="0.1" min="0" value={form.vis} onChange={(e) => setForm({ ...form, vis: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
          <label className="text-sm">Temp °C<input type="number" step="0.1" value={form.temp} onChange={(e) => setForm({ ...form, temp: e.target.value })} className="mt-1 w-full p-2 border rounded-lg" /></label>
          <div className="col-span-2 md:col-span-4 flex items-center gap-3">
            <button className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 font-medium">Evaluate + Save</button>
            {msg && <span className="text-sm text-gray-600">{msg}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
