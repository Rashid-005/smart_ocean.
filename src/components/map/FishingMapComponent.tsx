"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon paths
L.Icon.Default.imagePath = "https://unpkg.com/leaflet@1.9.4/dist/images/";

export type DestinationInfo = 
  | { type: "zone"; id: string; }
  | { type: "search"; lat: number; lon: number; name: string; };

// Helper to center the map when bounds or center change
function MapController({ center, bounds }: { center?: [number, number], bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else if (center) {
      map.setView(center, map.getZoom() || 10);
    }
  }, [center, bounds, map]);
  return null;
}

// Locate button to recenter on user
function LocateControl({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button 
      className="absolute bottom-6 right-6 z-[400] bg-white p-3 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-gray-200 hover:bg-gray-50 transition text-blue-800 flex items-center justify-center"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        map.setView(center, 12);
      }}
      title="My Location"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </button>
  );
}

export default function FishingMapComponent({
  userLat,
  userLon,
  zones,
  destination,
  onSelectZone,
  routePositions,
}: {
  userLat: number | null;
  userLon: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zones: any[];
  destination: DestinationInfo | null;
  onSelectZone: (id: string) => void;
  routePositions: [number, number][] | null;
}) {
  const selectedZone = destination?.type === "zone" ? zones.find(z => z.id === destination.id) : null;

  const youIcon = L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;background:#1d4ed8;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,.5)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const searchDestIcon = L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;background:#ef4444;border:3px solid white;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center"><div style="width:8px;height:8px;background:white;border-radius:50%"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getZoneIcon = (z: any, isSelected: boolean) => {
    const color = z.potential > 80 ? "#16a34a" : z.potential > 60 ? "#ca8a04" : "#dc2626";
    return L.divIcon({
      className: "",
      html: `<div style="background:${color};color:white;font-weight:700;font-size:12px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 0 8px rgba(0,0,0,.4);${isSelected ? "outline:4px solid #1d4ed8; outline-offset: 1px;" : ""}">${z.name.replace("Zone ", "")}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const hasGps = userLat !== null && userLon !== null;
  const mapCenter: [number, number] = hasGps ? [userLat, userLon] : [-5.9, 39.3]; // Zanzibar fallback

  const bounds = useMemo(() => {
    if (!hasGps) return undefined;
    if (destination?.type === "search") {
      return L.latLngBounds([userLat, userLon], [destination.lat, destination.lon]).pad(0.3);
    }
    if (selectedZone) {
      return L.latLngBounds([userLat, userLon], [selectedZone.latitude, selectedZone.longitude]).pad(0.3);
    }
    return undefined;
  }, [hasGps, userLat, userLon, destination, selectedZone]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={9} 
        style={{ width: "100%", height: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <ZoomControl position="topleft" />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController center={destination ? undefined : mapCenter} bounds={bounds} />

        {hasGps && (
          <Marker position={[userLat, userLon]} icon={youIcon}>
            <Popup>
              <div className="font-bold text-blue-900">Your current location</div>
            </Popup>
          </Marker>
        )}

        {zones.map(z => (
          <Marker 
            key={z.id} 
            position={[z.latitude, z.longitude]} 
            icon={getZoneIcon(z, destination?.type === "zone" && destination.id === z.id)}
            eventHandlers={{ 
              click: () => onSelectZone(z.id) 
            }}
          >
            <Popup>
              <div className="space-y-1 min-w-[120px]">
                <div className="font-bold text-blue-900 text-lg border-b pb-1 mb-1">{z.name}</div>
                <div className="text-sm">Potential: <span className="font-semibold">{z.potential}%</span></div>
                <div className="text-sm">Safety: <span className="font-semibold">{z.safety}</span></div>
              </div>
            </Popup>
          </Marker>
        ))}

        {destination?.type === "search" && (
          <Marker position={[destination.lat, destination.lon]} icon={searchDestIcon}>
            <Popup>
              <div className="font-bold text-gray-900">{destination.name}</div>
            </Popup>
          </Marker>
        )}

        {routePositions && routePositions.length > 0 && (
          <Polyline 
            positions={routePositions} 
            color={destination?.type === "zone" ? "#1d4ed8" : "#9333ea"} 
            weight={5} 
            dashArray={destination?.type === "zone" ? "10 8" : undefined} 
          />
        )}
        
        {hasGps && <LocateControl center={[userLat, userLon]} />}
      </MapContainer>
    </div>
  );
}
