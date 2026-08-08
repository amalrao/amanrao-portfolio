"use client";

import { useEffect } from "react";
import { invalidate } from "@react-three/fiber";
import { useSiteStore } from "@/lib/store";

// Same 16ms cap Lenis had: native "scroll" can fire far more often than the
// canvas can draw (high-polling-rate trackpads especially), so without this
// a zustand notify + demand-mode invalidate() would fire well past 60/sec.
// This only skips redundant intermediate writes — scrollY is read fresh
// each call, so it never delays or smooths the reported position.
const THROTTLE_MS = 16;

/**
 * Tracks scroll progress (0-1) straight off the native "scroll" event —
 * no smoothing/easing library. Lenis's inertia made scrolling feel heavy;
 * this reports exactly where the browser's own scroll position is, instant.
 */
export function useScrollProgress() {
  const setScrollProgress = useSiteStore((state) => state.setScrollProgress);

  useEffect(() => {
    let lastUpdate = 0;
    let prevProgress = 0;

    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? window.scrollY / total : 0;

      const now = performance.now();
      const velocity = Math.abs(progress - prevProgress);
      prevProgress = progress;
      if (now - lastUpdate < THROTTLE_MS) return;
      lastUpdate = now;

      setScrollProgress(progress, velocity);
      // Canvas is frameloop="demand" (see Scene.tsx) — nothing renders
      // unless something asks for a frame. This is that ask; the
      // scroll-driven components have their own invalidate() calls to
      // keep rendering for as long as they're actively animating.
      invalidate();
    };

    handleScroll(); // sync initial state (e.g. reload mid-page, scroll restoration)
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrollProgress]);
}
