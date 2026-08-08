

"use client";

import { useMemo, useRef } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const { vehicleEnd: DASHBOARD_START } = SCENE_TRANSITIONS;
const ENTRY_FADE_WIDTH = 0.1;
const EXIT_FADE_START = 0.85;
const EXIT_HIDE_AT = 0.9;

interface DashboardProps {
  position?: [number, number, number];
}

/**
 * Floating "data dashboard" panel of animated bar-chart columns — data-analyst
 * motif. Hidden until `DASHBOARD_START`, then fades in over `ENTRY_FADE_WIDTH`.
 */
export default function Dashboard({ position = [0, 0, 0] }: DashboardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const panelMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const barMatRefs = useRef<THREE.Material[]>([]);
  const bars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        x: (i - 3) * 0.28,
        baseHeight: 0.3 + Math.random() * 0.9,
        speed: 0.6 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
      })),
    [],
  );
  const barRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    const { scrollProgress } = useSiteStore.getState();
    const group = groupRef.current;
    if (!group) return;

    if (scrollProgress < DASHBOARD_START || scrollProgress > EXIT_HIDE_AT) {
      group.visible = false;
      return;
    }

    const entryVisibility = THREE.MathUtils.clamp(
      (scrollProgress - DASHBOARD_START) / ENTRY_FADE_WIDTH,
      0,
      1,
    );
    const visibility = scrollProgress > EXIT_FADE_START ? 0 : entryVisibility;
    group.visible = visibility > 0.01;
    group.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;

    if (panelMatRef.current) panelMatRef.current.opacity = visibility * 0.6;
    barMatRefs.current.forEach((mat) => {
      (mat as THREE.MeshStandardMaterial).opacity = visibility;
    });

    bars.forEach((bar, i) => {
      const mesh = barRefs.current[i];
      if (!mesh) return;
      const height =
        bar.baseHeight +
        Math.sin(state.clock.elapsedTime * bar.speed + bar.offset) * 0.2;
      mesh.scale.y = Math.max(0.05, height);
      mesh.position.y = mesh.scale.y / 2;
    });

    invalidate(); // bars breathe + panel sways continuously while visible
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Panel backing */}
      <mesh position={[0, 0.5, -0.05]}>
        <planeGeometry args={[2.2, 1.4]} />
        <meshStandardMaterial
          ref={panelMatRef}
          color={COLORS.secondary}
          transparent
          opacity={0.6}
        />
      </mesh>
      {bars.map((bar, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) barRefs.current[i] = m;
          }}
          position={[bar.x, bar.baseHeight / 2, 0]}
        >
          <boxGeometry args={[0.16, 1, 0.16]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) barMatRefs.current[i] = m;
            }}
            color={COLORS.accent}
            transparent
            emissive={new THREE.Color(COLORS.accent)}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
