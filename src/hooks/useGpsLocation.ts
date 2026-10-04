"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getBrowserPosition, type GpsFix } from "@/lib/location";

const INITIAL: GpsFix = {
  status: "locating",
  latitude: null,
  longitude: null,
  accuracy: null,
  error: null,
};

export function useGpsLocation() {
  const [fix, setFix] = useState<GpsFix>(INITIAL);
  const watchId = useRef<number | null>(null);

  const stopWatch = () => {
    if (watchId.current !== null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const request = useCallback(() => {
    setFix(INITIAL);
    getBrowserPosition()
      .then((pos) => {
        setFix({
          status: "ready",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          error: null,
        });
        if ("geolocation" in navigator) {
          stopWatch();
          watchId.current = navigator.geolocation.watchPosition(
            (p) =>
              setFix({
                status: "ready",
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
                accuracy: p.coords.accuracy ?? null,
                error: null,
              }),
            () => {},
            { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 },
          );
        }
      })
      .catch((err: Error) => {
        const msg = err?.message ?? "";
        const denied =
          msg.toLowerCase().includes("denied") || msg.toLowerCase().includes("permission");
        setFix({
          status: denied ? "denied" : "unavailable",
          latitude: null,
          longitude: null,
          accuracy: null,
          error: denied
            ? "Location permission was denied."
            : "Your current location is unavailable.",
        });
      });
  }, []);

  useEffect(() => {
    request();
    return stopWatch;
  }, [request]);

  return { ...fix, retry: request };
}
