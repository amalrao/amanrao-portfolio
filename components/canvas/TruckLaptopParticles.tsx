"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import * as THREE from "three";
import { useSiteStore } from "@/lib/store";
import { getPhaseInfo } from "@/lib/truckLaptopPhases";

const COUNT = 120;

const GREY = new THREE.Color("#444444");
const RED = new THREE.Color("#FF2A2A");
const BLUE = new THREE.Color("#0066FF");
const WHITE = new THREE.Color("#F5F5F0");

interface Particle {
  origin: THREE.Vector3;
  target: THREE.Vector3;
  scattered: THREE.Vector3;
  outDir: THREE.Vector3;
  outDistance: number;
  spinSeed: number;
}

/** Random point inside the truck's approximate footprint (cab + trailer). */
function sampleTruckPoint(): THREE.Vector3 {
  const inCab = Math.random() < 0.35;
  if (inCab) {
    return new THREE.Vector3(
      THREE.MathUtils.randFloat(0.2, 1.9),
      THREE.MathUtils.randFloat(-0.7, 1.4),
      THREE.MathUtils.randFloat(-1.5, 1.5),
    );
  }
  return new THREE.Vector3(
    THREE.MathUtils.randFloat(-4.4, 0.1),
    THREE.MathUtils.randFloat(-1, 1.1),
    THREE.MathUtils.randFloat(-1.1, 1.1),
  );
}

/** Random point across the open laptop's base + screen silhouette. */
function sampleLaptopPoint(): THREE.Vector3 {
  const onScreen = Math.random() < 0.6;
  if (onScreen) {
    return new THREE.Vector3(
      THREE.MathUtils.randFloat(-1.6, 1.6),
      THREE.MathUtils.randFloat(0.05, 2.15),
      THREE.MathUtils.randFloat(-1.32, -1.18),
    );
  }
  return new THREE.Vector3(
    THREE.MathUtils.randFloat(-1.75, 1.75),
    THREE.MathUtils.randFloat(-0.08, 0.08),
    THREE.MathUtils.randFloat(-1.25, 1.25),
  );
}

/**
 * 120 instanced-mesh particles that dissolve the truck outward (phase 3)
 * and converge into the laptop's silhouette (phase 4), shifting color from
 * grey → red → electric blue → white along the way.
 */
export default function TruckLaptopParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const geometry = meshRef.current?.geometry;
    console.log("[TruckLaptopParticles] geometry.type:", geometry?.type); // expect "SphereGeometry"
    if (geometry && geometry.type !== "SphereGeometry") {
      geometry.dispose();
      meshRef.current!.geometry = new THREE.SphereGeometry(0.06, 5, 5);
      console.log("[TruckLaptopParticles] forced geometry replacement to SphereGeometry");
    }
  }, []);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: COUNT }, () => {
      const origin = sampleTruckPoint();
      const target = sampleLaptopPoint();
      const outDir = origin
        .clone()
        .sub(new THREE.Vector3(-1.5, 0, 0))
        .normalize()
        .add(
          new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(1),
            THREE.MathUtils.randFloatSpread(1),
            THREE.MathUtils.randFloatSpread(1),
          ),
        )
        .normalize();
      return {
        origin,
        target,
        scattered: new THREE.Vector3(),
        outDir,
        outDistance: THREE.MathUtils.randFloat(1.5, 4.5),
        spinSeed: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const { scrollProgress } = useSiteStore.getState();
    const { phase, t } = getPhaseInfo(scrollProgress);

    if (phase < 3 || phase > 5) {
      mesh.visible = false;
      return;
    }

    let visibility = 1;
    let colorNow = GREY;

    if (phase === 3) {
      // Dissolve: fly outward from origin, ease-out.
      const ease = 1 - Math.pow(1 - t, 3);
      colorNow = GREY.clone().lerp(RED, t);
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        const jitter =
          Math.sin(state.clock.elapsedTime * 2 + p.spinSeed) * 0.05 * t;
        p.scattered
          .copy(p.outDir)
          .multiplyScalar(p.outDistance * ease + jitter)
          .add(p.origin);
        dummy.position.copy(p.scattered);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, colorNow);
      }
    } else if (phase === 4) {
      // Reassemble: converge from the phase-3 scattered cloud to the laptop.
      const ease = t * t * (3 - 2 * t); // smoothstep
      colorNow =
        t < 0.5 ? RED.clone().lerp(BLUE, t / 0.5) : BLUE.clone().lerp(WHITE, (t - 0.5) / 0.5);
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        const fromPos = p.outDir
          .clone()
          .multiplyScalar(p.outDistance)
          .add(p.origin);
        dummy.position.lerpVectors(fromPos, p.target, ease);
        dummy.scale.setScalar(THREE.MathUtils.lerp(1, 0.7, ease));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, colorNow);
      }
    } else if (phase === 5) {
      // Reveal: the solid laptop has taken over — fade the dust out.
      visibility = 1 - t;
      colorNow = WHITE;
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];
        dummy.position.copy(p.target);
        dummy.scale.setScalar(0.7 * visibility);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        mesh.setColorAt(i, colorNow);
      }
    }

    mesh.visible = visibility > 0.01;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // Glow color tracks the current phase color (grey/red/blue/white) rather
    // than a fixed hue, so the emissive boost reads as "glowing orb" at
    // every stage instead of tinting the blue/white reassembly phases red.
    if (matRef.current) matRef.current.emissive.copy(colorNow);

    invalidate(); // dissolve/reassemble/reveal — keep rendering while active
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.06, 5, 5]} />
      {/* Per-instance tint still comes from setColorAt (grey → red → blue →
          white); emissive adds the self-lit glow so particles read as
          radiant orbs instead of flat, unlit discs. toneMapped=false keeps
          that glow fully saturated instead of getting compressed by the
          renderer's tone-mapping curve (no EffectComposer/Bloom pass
          anymore — see Scene.tsx). */}
      <meshStandardMaterial
        ref={matRef}
        color="white"
        emissive="#FF4444"
        emissiveIntensity={0.8}
        roughness={0.4}
        metalness={0}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
