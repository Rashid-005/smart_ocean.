"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { useGpsLocation } from "@/hooks/useGpsLocation";
import { haversineDistanceKm, getBearing, getDirection } from "@/lib/geo";

// Dynamically import the map to avoid SSR window errors
const FishingMapComponent = dynamic(
  () => import("@/components/map/FishingMapComponent"),
  { 
    ssr: false, 
    loading: () => <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-800">Loading Map...</div> 
  }
);

import type { DestinationInfo } from "@/components/map/FishingMapComponent";

type Zone = {
  id: string;
  name: string;
  island: string;
  latitude: number;
  longitude: number;
  potential: number;
  confidence: string;
  species: string[];
  recommendedTime: string;
  safety: string;
  distanceKm?: number;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

type RouteData = {
  distanceKm: number;
  etaMinutes: number;
  direction: string;
  positions: [number, number][];
  isRoad: boolean;
  fuelEstimatedL: number;
};

function SmartMapInner() {
  const gps = useGpsLocation();
  const searchParams = useSearchParams();
  
  const [zones, setZones] = useState<Zone[]>([]);
  const [destination, setDestination] = useState<DestinationInfo | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Configuration settings (could be moved to a settings modal later)
  const [boatSpeedKmh, setBoatSpeedKmh] = useState(20);
  const [fuelConsumptionLpk, setFuelConsumptionLpk] = useState(1.5); // Litres per km

  const hasFix = gps.status === "ready" && gps.latitude !== null && gps.longitude !== null;
  const lat = hasFix ? gps.latitude : null;
  const lon = hasFix ? gps.longitude : null;

  // Load Zones
  useEffect(() => {
    const load = async () => {
      try {
        const url = hasFix ? `/api/fishing-zones?lat=${lat}&lon=${lon}` : `/api/fishing-zones`;
        const res = await fetch(url);
        const data = await res.json();
        const loadedZones = data.zones ?? [];
        setZones(loadedZones);

        // Pre-select destination from URL param if available
        const urlDest = searchParams.get("destination");
        if (urlDest) {
          const matchedZone = loadedZones.find((z: Zone) => z.id === urlDest || z.name === urlDest);
          if (matchedZone) {
            setDestination({ type: "zone", id: matchedZone.id });
          }
        }
      } catch (err) {
        console.error("Failed to load fishing zones:", err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFix, lat, lon]); // Removed searchParams to avoid loop, it runs on mount anyway

  // Handle Search Input
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
        const data = await res.json();
        setSearchResults(data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Update Route when destination or GPS changes
  useEffect(() => {
    if (!destination || lat === null || lon === null) {
      setRouteData(null);
      return;
    }

    const calculateRoute = async () => {
      if (destination.type === "zone") {
        const zone = zones.find(z => z.id === destination.id);
        if (!zone) return;
        const dKm = haversineDistanceKm(lat, lon, zone.latitude, zone.longitude);
        const eta = Math.max(1, Math.round((dKm / boatSpeedKmh) * 60));
        const brng = getBearing(lat, lon, zone.latitude, zone.longitude);
        const fuel = (dKm * 2) * fuelConsumptionLpk; // out and back
        
        setRouteData({
          distanceKm: dKm,
          etaMinutes: eta,
          direction: getDirection(brng) + ` (${Math.round(brng)}°)`,
          positions: [[lat, lon], [zone.latitude, zone.longitude]],
          isRoad: false,
          fuelEstimatedL: fuel,
        });
      } else if (destination.type === "search") {
        const destLat = destination.lat;
        const destLon = destination.lon;
        const brng = getBearing(lat, lon, destLat, destLon);
        const dirStr = getDirection(brng) + ` (${Math.round(brng)}°)`;

        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${lon},${lat};${destLon},${destLat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.code === "Ok" && data.routes && data.routes.length > 0) {
            const r = data.routes[0];
            const coords = r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
            const roadKm = r.distance / 1000;
            setRouteData({
              distanceKm: roadKm,
              etaMinutes: Math.max(1, Math.round(r.duration / 60)),
              direction: dirStr,
              positions: coords,
              isRoad: true,
              fuelEstimatedL: 0, // usually not using boat fuel for road trip
            });
            return;
          }
        } catch (err) {
          console.error("OSRM Routing failed", err);
        }
        
        // Fallback to straight line if OSRM fails
        const dKm = haversineDistanceKm(lat, lon, destLat, destLon);
        setRouteData({
          distanceKm: dKm,
          etaMinutes: Math.max(1, Math.round((dKm / 50) * 60)), // 50km/h car speed fallback
          direction: dirStr,
          positions: [[lat, lon], [destLat, destLon]],
          isRoad: false, // It's a fallback straight line
          fuelEstimatedL: 0,
        });
      }
    };
    calculateRoute();
  }, [destination, lat, lon, zones, boatSpeedKmh, fuelConsumptionLpk]);

  const selectedZone = destination?.type === "zone" ? zones.find(z => z.id === destination.id) : null;
  
  // Sort zones by potential to get recommendations
  const recommendedZones = useMemo(() => {
    return [...zones].sort((a, b) => b.potential - a.potential).slice(0, 3);
  }, [zones]);

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Search Bar (Top) */}
      <div className="relative w-full z-[1000] bg-white rounded-xl shadow-sm border border-gray-200" ref={searchRef}>
        <div className="relative flex items-center overflow-hidden rounded-xl focus-within:ring-2 focus-within:ring-blue-500">
          <span className="pl-4 text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input 
            type="text" 
            placeholder="Search a place, address, landmark or location..." 
            className="w-full py-4 px-4 outline-none text-gray-800 placeholder-gray-400 text-lg font-medium bg-transparent"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          />
          {isSearching && (
            <span className="pr-4">
              <svg className="w-6 h-6 text-blue-600 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            </span>
          )}
        </div>
        
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-[350px] overflow-y-auto z-[1000]">
            {searchResults.map((res, i) => (
              <button 
                key={res.place_id || i} 
                className="w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 flex flex-col items-start last:border-0 transition"
                onClick={() => {
                  setDestination({
                    type: "search",
                    lat: parseFloat(res.lat),
                    lon: parseFloat(res.lon),
                    name: res.display_name.split(",")[0],
                  });
                  setSearchQuery(res.display_name.split(",")[0]);
                  setShowDropdown(false);
                }}
              >
                <span className="font-bold text-gray-900 text-lg">{res.display_name.split(",")[0]}</span>
                <span className="text-sm text-gray-500 truncate w-full">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-[520px]">
        {/* Map Container */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden min-h-[420px] relative z-0 flex flex-col shadow-sm">
          
          {/* Status Overlay */}
          {gps.status === "locating" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white/90 backdrop-blur rounded-lg px-4 py-2 shadow-md border border-blue-200 text-blue-900 text-sm font-semibold">
              Detecting your current location...
            </div>
          )}

          {(gps.status === "denied" || gps.status === "unavailable") && (
            <div className="absolute top-4 left-4 right-4 z-[500] bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg border-2 border-yellow-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-yellow-500 text-xl">⚠️</span>
                <div>
                  <p className="font-bold text-blue-900">Location permission is required</p>
                  <p className="text-sm text-gray-600">Allow location access to get directions from your current location.</p>
                </div>
              </div>
              <button onClick={gps.retry} className="whitespace-nowrap px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition shadow-sm">
                Try Again
              </button>
            </div>
          )}

          <div className="flex-1 w-full relative">
            <FishingMapComponent 
              userLat={lat} 
              userLon={lon} 
              zones={zones} 
              destination={destination} 
              onSelectZone={(id) => setDestination({ type: "zone", id })} 
              routePositions={routeData?.positions ?? null}
            />
          </div>
        </div>

        {/* Info / Planning Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col max-h-full">
          
          {!destination ? (
            <div className="p-6 h-full overflow-y-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Plan Your Trip</h2>
                <p className="text-gray-500 text-sm">Select a recommended fishing zone or search for a custom destination.</p>
              </div>

              {recommendedZones.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm border-b pb-2">Recommended Fishing Zones Today</h3>
                  <div className="space-y-3">
                    {recommendedZones.map((z, idx) => (
                      <button
                        key={z.id}
                        onClick={() => setDestination({ type: "zone", id: z.id })}
                        className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition flex items-center justify-between group shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {idx === 0 && <span className="text-yellow-500 text-lg">★</span>}
                            <span className="font-bold text-blue-900 text-lg">{z.name}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{z.species?.slice(0, 2).join(", ")}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xl text-green-600">{z.potential}%</span>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Potential</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Trip Summary Header */}
              <div className="bg-blue-900 p-6 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="uppercase tracking-wider text-[10px] font-bold text-blue-200">
                    {destination.type === "zone" ? "Smart Fishing Destination" : "General Destination"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">
                  {destination.type === "zone" ? selectedZone?.name : destination.name}
                </h2>
                <button 
                  onClick={() => setDestination(null)}
                  className="mt-3 text-sm text-blue-200 hover:text-white underline underline-offset-2 opacity-80 hover:opacity-100 transition"
                >
                  Change Destination
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Fishing Zone Details */}
                {destination.type === "zone" && selectedZone && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                      <span className="text-gray-500 font-medium">Fishing Potential</span>
                      <span className="font-black text-2xl text-green-600">{selectedZone.potential}%</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500 font-medium">Expected Species</span>
                      <span className="font-bold text-gray-900 text-right max-w-[150px]">{selectedZone.species?.join(" + ") ?? "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500 font-medium">Recommended Time</span>
                      <span className="font-bold text-gray-900">{selectedZone.recommendedTime ?? "-"}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-3">
                      <span className="text-gray-500 font-medium">Ocean Safety</span>
                      <span className={`font-bold px-2 py-0.5 rounded ${selectedZone.safety === 'SAFE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{selectedZone.safety ?? "-"}</span>
                    </div>
                  </div>
                )}

                {/* Navigation Details */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Trip Information</h3>
                  {hasFix && routeData ? (
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200 shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">{routeData.isRoad ? "Direction" : "Course"}</span>
                        <span className="font-bold text-gray-900">{routeData.direction}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Distance</span>
                        <span className="font-bold text-gray-900 text-lg">{routeData.distanceKm.toFixed(1)} km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Estimated Travel Time</span>
                        <span className="font-bold text-gray-900 text-lg">{routeData.etaMinutes} min</span>
                      </div>
                      
                      {destination.type === "zone" && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-500 font-medium flex items-center gap-1">
                            Estimated Fuel 
                            <span className="text-[10px] text-gray-400 font-normal">(@{fuelConsumptionLpk}L/km)</span>
                          </span>
                          <span className="font-black text-blue-700 text-lg">≈ {Math.ceil(routeData.fuelEstimatedL)} L</span>
                        </div>
                      )}
                      
                      <div className="pt-3 text-[11px] text-gray-400 text-right uppercase tracking-wider font-bold">
                        {routeData.isRoad ? "Road Route" : "Marine Course"}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center space-y-2 text-yellow-800">
                      <p className="font-bold text-lg">Allow location access</p>
                      <p className="text-sm">Distance, direction, travel time and fuel estimates require your current location.</p>
                      <button onClick={gps.retry} className="mt-2 px-4 py-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-900 rounded font-semibold text-sm transition">
                        Enable GPS
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-3 mt-auto">
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 bg-white text-blue-900 font-bold rounded-lg hover:bg-blue-50 transition border-2 border-blue-100 shadow-sm">
                    View Route
                  </button>
                  <button 
                    className="py-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-800 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!hasFix || !routeData}
                  >
                    Start Navigation
                  </button>
                </div>
                {destination.type === "zone" && (
                  <a href={`/reports?zone=${destination.id}`} className="text-center text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-1 block">
                    Save Trip Using Fishing Report
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SmartMap() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center">Loading Map Tool...</div>}>
      <SmartMapInner />
    </Suspense>
  );
}
