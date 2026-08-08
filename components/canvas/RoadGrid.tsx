"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const { globeEnd: GRID_START } = SCENE_TRANSITIONS;
const GRID_END = 0.3; // through the drive-in and stop phases (matches PHASE_BOUNDS phase 2 end)
const FADE_WIDTH = 0.05;

/** Subtle dark road grid under the truck during phases 1–2. */
export default function RoadGrid() {
  const gridRef = useRef<THREE.GridHelper>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);

  // No invalidate() call here: opacity is a pure function of scrollProgress
  // with no state.clock-driven motion, so the one frame the scroll
  // handler's own invalidate() already scheduled is enough to pick up the
  // new value — there's nothing further to animate between scroll events.
  useFrame(() => {
    const { scrollProgress } = useSiteStore.getState();
    const grid = gridRef.current;
    if (!grid) return;

    if (scrollProgress < GRID_START || scrollProgress >= GRID_END) {
      grid.visible = false;
      return;
    }

    const fadeIn = THREE.MathUtils.clamp(
      (scrollProgress - GRID_START) / FADE_WIDTH,
      0,
      1,
    );
    const fadeOut = THREE.MathUtils.clamp(
      (GRID_END - scrollProgress) / FADE_WIDTH,
      0,
      1,
    );
    const opacity = Math.min(fadeIn, fadeOut) * 0.25;

    grid.visible = opacity > 0.01;
    if (materialRef.current) {
      materialRef.current.opacity = opacity;
    }
  });

  return (
    <gridHelper
      ref={gridRef}
      args={[40, 40, COLORS.secondary, COLORS.secondary]}
      position={[0, -2, 0]}
    >
      <lineBasicMaterial
        ref={materialRef}
        color={COLORS.secondary}
        transparent
        opacity={0}
      />
    </gridHelper>
  );
}
