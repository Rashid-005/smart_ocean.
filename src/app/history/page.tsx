"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  date: string;
  zoneId: string;
  species: string;
  quantityKg?: number;
  fuelUsedLiters?: number;
  observations?: string;
  createdAt?: string;
  zone?: { id: string; name: string };
  reportSpecies?: { id: string; name: string }[];
};

export default function History() {
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState<Report | null>(null);

  const load = async () => {
    const response = await fetch("/api/fishing-reports");
    const data = await response.json();
    setReports(data.reports ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const view = async (id: string) => {
    const res = await fetch(`/api/fishing-reports/${id}`);
    const data = await res.json();
    if (res.ok) setDetails(data.report);
    else setStatus(data.error || "Failed to load details");
  };

  const remove = async (id: string) => {
    setStatus("Deleting...");
    const res = await fetch(`/api/fishing-reports/${id}`, { method: "DELETE" });
    const data = await res.json();
    setStatus(res.ok ? "Deleted" : data.error || "Delete failed");
    if (res.ok) {
      if (details?.id === id) setDetails(null);
      load();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">My Reports / History</h1>
      {status && <p className="text-sm text-gray-600">{status}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg text-blue-900 border-b pb-2 mb-4">{new Date(report.date).toLocaleDateString()}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Zone:</span> <span className="font-medium">{report.zone?.name ?? report.zoneId}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Species:</span> <span className="font-medium">{report.species}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Catch:</span> <span className="font-medium text-green-700">{report.quantityKg ?? 0} kg</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fuel:</span> <span className="font-medium">{report.fuelUsedLiters ?? 0} L</span></div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => view(report.id)} className="flex-1 py-2 border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-50 transition font-medium text-sm">
                View Details
              </button>
              <button onClick={() => remove(report.id)} className="flex-1 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition font-medium text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {details && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-blue-900">Trip details</h2>
            <button onClick={() => setDetails(null)} className="text-sm text-gray-500 hover:underline">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p><span className="text-gray-500">ID:</span> {details.id}</p>
            <p><span className="text-gray-500">Date:</span> {new Date(details.date).toLocaleString()}</p>
            <p><span className="text-gray-500">Zone:</span> {(details.zone as { name?: string } | undefined)?.name ?? details.zoneId}</p>
            <p><span className="text-gray-500">Species:</span> {details.species}</p>
            <p><span className="text-gray-500">Catch:</span> {details.quantityKg ?? 0} kg</p>
            <p><span className="text-gray-500">Fuel:</span> {details.fuelUsedLiters ?? 0} L</p>
          </div>
          {details.reportSpecies && details.reportSpecies.length > 0 && (
            <p className="text-sm"><span className="text-gray-500">Species breakdown:</span> {details.reportSpecies.map((s) => s.name).join(", ")}</p>
          )}
          {details.observations && (
            <p className="text-sm"><span className="text-gray-500">Observations:</span> {details.observations}</p>
          )}
          {details.createdAt && (
            <p className="text-xs text-gray-400">Saved {new Date(details.createdAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
}
