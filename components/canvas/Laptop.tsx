"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { createCodeCanvas, drawCodeFrame } from "@/lib/canvasTextures";
import { useSiteStore } from "@/lib/store";

const { vehicleEnd: VEHICLE_END } = SCENE_TRANSITIONS;
// Must track PHASE_BOUNDS phase 4/5 starts in lib/truckLaptopPhases.ts.
const REASSEMBLE_START = 0.36;
const REVEAL_START = 0.41;
// Must track SCENE_TRANSITIONS.contentReveal (vehicleEnd + this width) in
// lib/constants.ts — that's how long Services/About/Projects/Testimonial
// wait before fading in, specifically so they don't appear while the
// laptop is still visibly fading out underneath them. Kept narrow: on this
// page's layout, Services sits close enough behind vehicleEnd that a wide
// fade (previously 0.1) pushed contentReveal past where Services' own text
// is still on screen, making it unreachable.
const EXIT_FADE_WIDTH = 0.03;

const EMERGE_SCALE = 0.15; // starting scale while emerging from the particle cloud's center
const SETTLED_SCALE = 1.4;

// laptop.glb measures ~0.5 units wide at native scale (it's modeled close
// to real-world meters). 7x on top of SETTLED_SCALE(1.4) lands at ~4.9
// units wide once fully revealed, matching the old procedural laptop's
// rendered size. The model is already posed screen-up/open (confirmed by
// inspecting laptopdisplay_LP's bounding box — it's tall, not flat), so
// unlike the primitive version there's no separate hinge-open animation;
// only the scale-based emerge remains.
const LAPTOP_SCALE = 7;
// Unverified rotation — the model's "facing" convention wasn't confirmed
// by inspection. Start here and adjust after a visual check.
const LAPTOP_ROTATION_Y = Math.PI * 0.1;

// Boot flicker: screen stays off for the first 70% of reassembly, then
// flickers through 3 dim/bright cycles before the reveal phase snaps it on.
const FLICKER_START_T = 0.7;
const FLICKER_STEPS = 6;

/** Real GLB mesh name, from inspecting laptop.glb directly — the actual
 * Mesh is "laptopdisplay_LP_msi_laptop_mat_0"; "laptopdisplay_LP" alone is
 * just its parent Object3D group, which has no mesh of its own. */
const SCREEN_MESH_PREFIX = "laptopdisplay_LP";

/**
 * Real MSI laptop (laptop.glb), replacing the hand-built primitive rig.
 * Invisible until phase 4 (reassembly), fades/scales in with a blue/cyan
 * glowing screen, then boots the scrolling green code display once phase 5
 * (reveal) begins. Fades back out past `VEHICLE_END` for the dashboard
 * handoff.
 */
export default function Laptop() {
  const groupRef = useRef<THREE.Group>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const screenMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const { scene: laptopScene } = useGLTF("/models/laptop.glb");

  const { canvas, ctx, texture } = useMemo(() => createCodeCanvas(), []);
  const codeOffset = useRef(0);
  const codeApplied = useRef(false);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  const laptop = useMemo(() => {
    const clonedScene = laptopScene.clone(true);

    const materials: THREE.MeshStandardMaterial[] = [];
    let screenMat: THREE.MeshStandardMaterial | null = null;

    clonedScene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (mesh.name.startsWith(SCREEN_MESH_PREFIX)) {
        screenMat = new THREE.MeshStandardMaterial({
          color: "#001133",
          emissive: "#0066FF",
          emissiveIntensity: 0,
          roughness: 0.1,
          metalness: 0.1,
          transparent: true,
          opacity: 0,
        });
        mesh.material = screenMat;
        materials.push(screenMat);
      } else {
        const mat = (
          Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
        ).clone() as THREE.MeshStandardMaterial;
        mat.transparent = true;
        mesh.material = mat;
        materials.push(mat);
      }
    });

    materialsRef.current = materials;
    screenMatRef.current = screenMat;
    return clonedScene;
  }, [laptopScene]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { scrollProgress } = useSiteStore.getState();

    if (scrollProgress < REASSEMBLE_START) {
      group.visible = false;
      codeApplied.current = false;
      return;
    }

    let visibility: number;
    let glow: number;
    let showCode: boolean;
    let bootFlicker = 1;

    if (scrollProgress < REVEAL_START) {
      // Phase 4: reassembly — fade/scale in from the particle cloud's
      // center, screen stays dark then flickers awake near the end.
      const t =
        (scrollProgress - REASSEMBLE_START) / (REVEAL_START - REASSEMBLE_START);
      visibility = THREE.MathUtils.clamp(t, 0, 1);
      glow = visibility;
      showCode = false;

      if (t < FLICKER_START_T) {
        bootFlicker = 0;
      } else {
        const flickerT = (t - FLICKER_START_T) / (1 - FLICKER_START_T);
        const flickerStep = Math.min(
          FLICKER_STEPS - 1,
          Math.floor(flickerT * FLICKER_STEPS),
        );
        bootFlicker = flickerStep % 2 === 0 ? 0 : 1;
      }
    } else if (scrollProgress < VEHICLE_END) {
      // Phase 5: reveal — fully formed, code boots up on screen.
      visibility = 1;
      glow = 1;
      showCode = true;
    } else {
      // Post-scene: fade out for the dashboard handoff.
      const fadeOutT = THREE.MathUtils.clamp(
        (scrollProgress - VEHICLE_END) / EXIT_FADE_WIDTH,
        0,
        1,
      );
      visibility = 1 - fadeOutT;
      glow = 1;
      showCode = true;
    }

    group.visible = visibility > 0.01;
    group.scale.setScalar(
      THREE.MathUtils.lerp(EMERGE_SCALE, SETTLED_SCALE, visibility),
    );

    // Gentle float + rotation once fully revealed.
    const floatT = THREE.MathUtils.clamp(
      (scrollProgress - REVEAL_START) / 0.02,
      0,
      1,
    );
    group.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05 * floatT;
    group.rotation.y =
      LAPTOP_ROTATION_Y +
      Math.sin(state.clock.elapsedTime * 0.3) * 0.1 * floatT +
      (1 - visibility) * 0.4;

    materialsRef.current.forEach((mat) => {
      mat.opacity = mat === screenMatRef.current ? mat.opacity : visibility;
    });

    const screenMat = screenMatRef.current;
    if (screenMat) {
      screenMat.opacity = visibility;
      if (showCode) {
        if (!codeApplied.current) {
          screenMat.emissiveMap = texture;
          screenMat.emissive.set("#ffffff");
          screenMat.needsUpdate = true;
          codeApplied.current = true;
        }
        codeOffset.current += delta * 30;
        drawCodeFrame(ctx, canvas, codeOffset.current);
        texture.needsUpdate = true;
        screenMat.emissiveIntensity = 1.1;
      } else {
        screenMat.emissive.set("#0066FF");
        screenMat.emissiveIntensity = glow * 0.8 * bootFlicker;
      }
    }

    invalidate(); // float/rotation/code-scroll — keep rendering while visible
  });

  return (
    <group ref={groupRef} position={[2.5, 0, 0]}>
      <primitive object={laptop} scale={LAPTOP_SCALE} />
    </group>
  );
}

useGLTF.preload("/models/laptop.glb");
