"use client";

import { useEffect, useState } from "react";

type Overview = {
  counts: { users: number; zones: number; reports: number; conversations: number };
  recentUsers: { id: string; fullName: string; phone: string; island: string; role: string }[];
  zones: { id: string; name: string; island: string; potential: number; safety: string; active: boolean }[];
};

export default function Admin() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [thresholds, setThresholds] = useState({ moderateWind: "15", dangerousWind: "25", moderateWave: "1.4", dangerousWave: "2.2", moderateVisibility: "5", dangerousVisibility: "2" });

  const load = async () => {
    const res = await fetch("/api/admin/overview");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Forbidden");
      return;
    }
    setData(json);
    const t = await fetch("/api/admin/settings").then((r) => r.json()).catch(() => null);
    if (t?.thresholds) {
      setThresholds({
        moderateWind: String(t.thresholds.moderateWind),
        dangerousWind: String(t.thresholds.dangerousWind),
        moderateWave: String(t.thresholds.moderateWave),
        dangerousWave: String(t.thresholds.dangerousWave),
        moderateVisibility: String(t.thresholds.moderateVisibility),
        dangerousVisibility: String(t.thresholds.dangerousVisibility),
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateZone = async (id: string, patch: Record<string, unknown>) => {
    setMsg("Saving zone...");
    const res = await fetch(`/api/admin/zones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    setMsg(res.ok ? "Zone updated" : json.error || "Failed");
    if (res.ok) load();
  };

  const saveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Saving thresholds...");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moderateWind: Number(thresholds.moderateWind),
        dangerousWind: Number(thresholds.dangerousWind),
        moderateWave: Number(thresholds.moderateWave),
        dangerousWave: Number(thresholds.dangerousWave),
        moderateVisibility: Number(thresholds.moderateVisibility),
        dangerousVisibility: Number(thresholds.dangerousVisibility),
      }),
    });
    const json = await res.json();
    setMsg(res.ok ? "Thresholds updated" : json.error || "Failed");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-blue-900">Admin Dashboard</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded text-yellow-800">
          <p className="font-medium">Access denied</p>
          <p className="text-sm">{error} — please sign in with an administrator account.</p>
        </div>
      </div>
    );
  }

  if (!data) return <div className="text-blue-900">Loading admin data...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Admin Dashboard</h1>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data.counts).map(([k, v]) => (
          <div key={k} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 capitalize">{k}</p>
            <p className="text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>
      <div id="zones" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="font-bold mb-3">Fishing Zones</h2>
        <div className="space-y-2 text-sm">
          {data.zones.map((z) => (
            <div key={z.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <span>{z.name} • {z.island} • {z.potential}% • {z.safety} • {z.active ? "active" : "inactive"}</span>
              <span className="flex gap-2">
                <button onClick={() => updateZone(z.id, { active: !z.active })} className="px-3 py-1 border rounded-lg hover:bg-gray-50">{z.active ? "Deactivate" : "Activate"}</button>
                <button onClick={() => updateZone(z.id, { safety: "SAFE" })} className="px-3 py-1 border rounded-lg hover:bg-gray-50">Set SAFE</button>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div id="safety" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="font-bold mb-3">Safety Configuration</h2>
        <form onSubmit={saveThresholds} className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {(Object.keys(thresholds) as (keyof typeof thresholds)[]).map((k) => (
            <label key={k} className="space-y-1">{k}
              <input value={thresholds[k]} onChange={(e) => setThresholds({ ...thresholds, [k]: e.target.value })} type="number" step="0.1" className="w-full p-2 border rounded-lg" />
            </label>
          ))}
          <div className="col-span-2 md:col-span-3">
            <button className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 font-medium">Save thresholds</button>
          </div>
        </form>
      </div>
      <div id="users" className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="font-bold mb-3">Users</h2>
        <div className="space-y-2 text-sm">
          {data.recentUsers.map((u) => (
            <div key={u.id} className="flex justify-between border-b pb-1">
              <span>{u.fullName} • {u.phone}</span>
              <span className="font-medium">{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
