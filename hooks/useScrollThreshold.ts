"use client";

import { useEffect, useState } from "react";
import { useSiteStore } from "@/lib/store";

/**
 * Reactively tracks whether scrollProgress has reached `threshold`, updating
 * only when the boolean actually flips rather than on every scroll tick.
 */
export function useScrollThreshold(threshold: number): boolean {
  const [reached, setReached] = useState(
    () => useSiteStore.getState().scrollProgress >= threshold,
  );

  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe((state, prevState) => {
      const next = state.scrollProgress >= threshold;
      const prev = prevState.scrollProgress >= threshold;
      if (next !== prev) setReached(next);
    });
    return unsubscribe;
  }, [threshold]);

  return reached;
}
