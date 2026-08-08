"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree, invalidate } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const { globeEnd: VEHICLE_START, vehicleEnd: VEHICLE_END } = SCENE_TRANSITIONS;
const FADE_WIDTH = 0.1;

interface ParticlesProps {
  count?: number;
  radius?: number;
}

/** Ambient starfield behind the globe and dashboard scenes; hidden during the vehicle window. */
export default function Particles({ count = 200, radius = 12 }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const viewportWidth = useThree((state) => state.size.width);
  const effectiveCount = viewportWidth < 768 ? Math.min(count, 100) : count;

  const positions = useMemo(() => {
    const array = new Float32Array(effectiveCount * 3);
    for (let i = 0; i < effectiveCount; i++) {
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      array[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      array[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      array[i * 3 + 2] = r * Math.cos(phi);
    }
    return array;
  }, [effectiveCount, radius]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const { scrollProgress } = useSiteStore.getState();
    let visibility: number;
    if (scrollProgress < VEHICLE_START) {
      visibility = 1;
    } else if (scrollProgress < VEHICLE_START + FADE_WIDTH) {
      visibility = 1 - (scrollProgress - VEHICLE_START) / FADE_WIDTH;
    } else if (scrollProgress < VEHICLE_END - FADE_WIDTH) {
      visibility = 0;
    } else if (scrollProgress < VEHICLE_END) {
      visibility = (scrollProgress - (VEHICLE_END - FADE_WIDTH)) / FADE_WIDTH;
    } else {
      visibility = 1;
    }

    points.visible = visibility > 0.01;
    if (!points.visible) return; // skip rotation/opacity work while fully hidden

    if (materialRef.current) materialRef.current.opacity = visibility * 0.5;
    points.rotation.y += delta * 0.02;
    points.rotation.x += delta * 0.005;
    invalidate(); // ambient drift — keep rendering while visible
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color={COLORS.white}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </points>
  );
}
