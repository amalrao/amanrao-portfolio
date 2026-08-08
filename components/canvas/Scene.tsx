"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { COLORS } from "@/lib/constants";
import Truck from "./Truck";
import Laptop from "./Laptop";
import Dashboard from "./Dashboard";
import Globe from "./Globe";
import Particles from "./Particles";
import RoadGrid from "./RoadGrid";
import TruckLaptopParticles from "./TruckLaptopParticles";
import TruckLaptopCameraRig from "./TruckLaptopCameraRig";
import TruckLaptopLighting from "./TruckLaptopLighting";
import TruckPhaseReporter from "./TruckPhaseReporter";

/** Caps the renderer's device pixel ratio on small screens so mobile GPUs
 *  aren't pushed to the same effective resolution as desktop. */
function MobilePixelRatio() {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    if (window.innerWidth < 768) {
      gl.setPixelRatio(1);
    }
  }, [gl]);
  return null;
}

export default function Scene() {
  return (
    <Canvas
      frameloop="demand"
      className="!fixed inset-0 !h-screen !w-screen"
      camera={{ position: [0, 2, 12], fov: 55 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <color attach="background" args={[COLORS.background]} />
      <fog attach="fog" args={[COLORS.background, 13, 23]} />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[3, 4, 2]}
        intensity={1.2}
        color={COLORS.white}
      />
      <pointLight position={[-3, -1, -2]} intensity={2} color={COLORS.accent} />

      <MobilePixelRatio />

      <Suspense fallback={null}>
        <Particles />
        <RoadGrid />
        <Truck />
        {/* Own Suspense boundary: the laptop model shouldn't hold up the
            truck/globe/dashboard — which appear earlier in the cinematic
            and don't depend on it — just because it's still loading. */}
        <Suspense fallback={null}>
          <Laptop />
        </Suspense>
        <TruckLaptopParticles />
        {/* Off to the laptop's opposite side and pushed back in z — the
            laptop (components/canvas/Laptop.tsx) renders ~4.9 units wide
            centered on x=2.5, so this keeps the digital-system visual
            clearly peripheral instead of overlapping its silhouette. */}
        <Dashboard position={[-2.2, 0.4, -2.5]} />
        <Globe />
        <TruckLaptopLighting />
      </Suspense>

      <TruckLaptopCameraRig />
      <TruckPhaseReporter />

      {/* EffectComposer/Bloom removed for performance: a full-resolution
          multi-pass blur+threshold+composite chain running every frame,
          on top of native antialiasing, is expensive GPU fill-rate work —
          on mid-range hardware it was the single biggest frame-time cost
          in this scene. All the objects that relied on it for "glow"
          (headlights, grille, rings, pins, arcs, screen, keys, bars) use
          emissive materials, which already render bright/saturated
          without bloom — they just no longer bleed light into
          neighboring pixels. */}
    </Canvas>
  );
}
