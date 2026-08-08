"use client";

import { useRef } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import * as THREE from "three";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";
import { getPhaseInfo } from "@/lib/truckLaptopPhases";

const { globeEnd: VEHICLE_START, vehicleEnd: VEHICLE_END } = SCENE_TRANSITIONS;
const EXIT_FADE_WIDTH = 0.1;
// Was 4 — a subtle bump so the laptop (now ~25% larger, see Laptop.tsx)
// reads more clearly against the dark background during reassembly/reveal.
const LAPTOP_BLUE_INTENSITY = 5;

/**
 * Dedicated, phase-driven lighting for the truck→laptop cinematic scene:
 * warm light while the truck drives/idles, a dramatic red pulse as it
 * dissolves, and a building blue/cyan glow through reassembly and reveal.
 * Sits alongside (doesn't replace) the base scene lights.
 */
export default function TruckLaptopLighting() {
  const warmRef = useRef<THREE.PointLight>(null);
  const redRef = useRef<THREE.PointLight>(null);
  const blueRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const { scrollProgress } = useSiteStore.getState();
    const warm = warmRef.current;
    const red = redRef.current;
    const blue = blueRef.current;
    const flash = flashRef.current;
    const key = keyRef.current;
    const hemi = hemiRef.current;
    const rim = rimRef.current;
    if (!warm || !red || !blue || !flash || !key || !hemi || !rim) return;

    if (
      scrollProgress < VEHICLE_START ||
      scrollProgress >= VEHICLE_END + EXIT_FADE_WIDTH
    ) {
      warm.intensity = 0;
      red.intensity = 0;
      blue.intensity = 0;
      flash.intensity = 0;
      key.intensity = 0;
      hemi.intensity = 0;
      rim.intensity = 0;
      return;
    }

    const { phase, t } = getPhaseInfo(scrollProgress);

    warm.intensity = phase === 1 || phase === 2 ? 3 : 0;

    // Fixed truck-scene lighting rig — on for the drive-in/idle phases only.
    const truckLit = phase === 1 || phase === 2;
    key.intensity = truckLit ? 3 : 0;
    hemi.intensity = truckLit ? 0.8 : 0;
    rim.intensity = truckLit ? 2 : 0;

    if (phase === 3) {
      const pulse = Math.sin(state.clock.elapsedTime * 8) * 0.6;
      red.intensity = Math.max(0, t * 8 + pulse);
    } else {
      red.intensity = 0;
    }

    // Bright flash the instant the laptop fully forms, peaking near t=0.85.
    if (phase === 4) {
      flash.intensity = Math.max(0, 1 - Math.abs(t - 0.85) / 0.08) * 15;
    } else {
      flash.intensity = 0;
    }

    if (phase === 4) {
      blue.intensity = THREE.MathUtils.lerp(0, LAPTOP_BLUE_INTENSITY, t);
    } else if (phase === 5) {
      blue.intensity = LAPTOP_BLUE_INTENSITY;
    } else if (scrollProgress >= VEHICLE_END) {
      const fadeOutT = THREE.MathUtils.clamp(
        (scrollProgress - VEHICLE_END) / EXIT_FADE_WIDTH,
        0,
        1,
      );
      blue.intensity = LAPTOP_BLUE_INTENSITY * (1 - fadeOutT);
    } else {
      blue.intensity = 0;
    }

    // Phase 3's pulse and phase 4's flash are driven by state.clock, not
    // just scrollProgress, so they need continuous frames while active.
    // Every other phase here (1, 2, 5, and the post-scene fade) only sets
    // intensities as pure functions of scrollProgress — the one frame the
    // scroll handler's own invalidate() already scheduled is enough, so we
    // don't force continuous rendering for those.
    if (phase === 3 || phase === 4) {
      invalidate();
    }
  });

  return (
    <>
      <pointLight
        ref={warmRef}
        position={[2, 3, 4]}
        color="#FFAA55"
        intensity={0}
        distance={20}
      />
      <pointLight
        ref={redRef}
        position={[0, 1, 3]}
        color="#FF2A2A"
        intensity={0}
        distance={20}
      />
      <pointLight
        ref={blueRef}
        position={[0, 1.5, 3]}
        color="#0066FF"
        intensity={0}
        distance={20}
      />
      <pointLight
        ref={flashRef}
        position={[0, 1.5, 3]}
        color="#FFFFFF"
        intensity={0}
        distance={25}
      />
      <directionalLight
        ref={keyRef}
        color="#FFD080"
        intensity={0}
        position={[-5, 5, -8]}
      />
      <hemisphereLight ref={hemiRef} args={["#1C3A5A", "#0A0A0A", 0]} />
      <pointLight
        ref={rimRef}
        color="#E8382D"
        intensity={0}
        distance={15}
        position={[0, 3, 8]}
      />
    </>
  );
}
