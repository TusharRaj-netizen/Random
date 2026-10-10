"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_LAT, DEFAULT_LNG } from "./defaults";

export interface UserLocation {
  lat: number;
  lng: number;
  source: "gps" | "fallback";
  accuracy: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * useUserLocation — high-accuracy browser geolocation with graceful fallback
 * to the default Guwahati, Assam coordinates (26.1878, 91.6916).
 *
 * The hook requests the position once on mount (high accuracy) and exposes a
 * `refresh()` method to re-acquire. If geolocation is unavailable, denied, or
 * times out, it silently falls back to the default coordinates so the UI always
 * has a usable location.
 */
export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    source: "fallback",
    accuracy: null,
    loading: true,
    error: null,
  });

  const acquire = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocation((p) => ({ ...p, loading: false }));
      return;
    }
    setLocation((p) => ({ ...p, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          source: "gps",
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (err) => {
        // Fall back to default coordinates on any error.
        setLocation({
          lat: DEFAULT_LAT,
          lng: DEFAULT_LNG,
          source: "fallback",
          accuracy: null,
          loading: false,
          error: err.message,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    acquire();
  }, [acquire]);

  return { location, refresh: acquire };
}