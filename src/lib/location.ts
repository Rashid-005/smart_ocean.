// Real browser/device GPS is the single source of truth for user location.
// There is no fallback coordinate: when GPS is unavailable the location is
// simply unknown (null) and the UI must say so.

export type GpsStatus = "locating" | "ready" | "denied" | "unavailable";

export type GpsFix = {
  status: GpsStatus;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
};

// Supported fishing area: Unguja and Pemba (with a small margin).
const AREAS = [
  { minLat: -6.75, maxLat: -5.85, minLon: 39.0, maxLon: 39.7 }, // Unguja
  { minLat: -5.55, maxLat: -4.75, minLon: 39.55, maxLon: 40.0 }, // Pemba
];

export function isSupportedArea(latitude: number, longitude: number) {
  return AREAS.some(
    (a) =>
      latitude >= a.minLat &&
      latitude <= a.maxLat &&
      longitude >= a.minLon &&
      longitude <= a.maxLon,
  );
}

export function getBrowserPosition(timeoutMs = 10000): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 30000,
    });
  });
}
