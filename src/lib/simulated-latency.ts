"use client";

import { useEffect, useState } from "react";

// Stand-ins for network latency in this frontend-only demo — each call site marks where
// a real API request will eventually go. Nothing here contacts a server.
export const SIMULATED_FETCH_MS = 350;
export const SIMULATED_ACTION_MS = 450;

export function simulateLatency(ms: number = SIMULATED_ACTION_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// True for a brief moment after mount, so each page shows its skeleton like a real fetch.
export function useSimulatedLoading(ms: number = SIMULATED_FETCH_MS): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return loading;
}
