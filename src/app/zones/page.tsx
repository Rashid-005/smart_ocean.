"use client";

import { useEffect, useState } from "react";

type Zone = {
  id: string;
  name: string;
  island: string;
  potential: number;
  confidence: string;
  species: string[];
  recommendedTime: string;
  safety: string;
  distanceKm?: number;
};

import { useGpsLocation } from "@/hooks/useGpsLocation";

export default function Zones() {
  const gps = useGpsLocation();
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    const loadZones = async () => {
      const url =
        gps.status === "ready"
          ? `/api/fishing-zones?lat=${gps.latitude}&lon=${gps.longitude}`
          : "/api/fishing-zones";
      const response = await fetch(url);
      const data = await response.json();
      setZones(data.zones ?? []);
    };

    loadZones();
  }, [gps.status, gps.latitude, gps.longitude]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-blue-900">Fishing Zones</h1>
        {gps.status === "ready" && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-800">
            Sorted by your location
          </span>
        )}
      </div>
      {gps.status === "locating" && (
        <p className="text-sm text-gray-500">Finding your location to sort zones by distance…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zones.map((zone) => (
          <div key={zone.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-blue-900">{zone.name}</h2>
                <p className="text-sm text-gray-500">{zone.island}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${zone.potential > 80 ? "bg-green-100 text-green-800" : zone.potential > 60 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                {zone.potential}% Potential
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Expected Species:</span> <span className="font-medium">{zone.species.join(", ")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Best Time:</span> <span className="font-medium">{zone.recommendedTime}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Safety:</span> <span className="font-medium">{zone.safety}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Distance:</span> <span className="font-medium">{zone.distanceKm ? `${zone.distanceKm.toFixed(1)} km` : "--"}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
