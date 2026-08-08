"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useSiteStore } from "@/lib/store";
import { getPhaseInfo } from "@/lib/truckLaptopPhases";

/**
 * Mirrors the truck→laptop scene's current phase/progress into the zustand
 * store so HTML overlays can react to it, without spamming re-renders:
 * only pushes an update when the phase changes or progress moves by a
 * perceptible amount.
 */
export default function TruckPhaseReporter() {
  const lastRef = useRef({ phase: -1, t: -1 });

  // No invalidate() here: this writes to zustand only, never touches an
  // Object3D or material, so it has nothing to contribute to a canvas
  // frame — it just needs to run whenever some other invalidate() (the
  // scroll handler, or an actively-animating component) schedules one.
  useFrame(() => {
    const { scrollProgress, setTruckPhase } = useSiteStore.getState();
    const { phase, t } = getPhaseInfo(scrollProgress);
    const roundedT = Math.round(t * 50) / 50;

    if (phase !== lastRef.current.phase || roundedT !== lastRef.current.t) {
      lastRef.current = { phase, t: roundedT };
      setTruckPhase(phase, roundedT);
    }
  });

  return null;
}
