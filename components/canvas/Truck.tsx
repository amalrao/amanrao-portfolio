"use client";

import { useMemo, useRef } from "react";
import { useFrame, invalidate } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";
import { getPhaseInfo } from "@/lib/truckLaptopPhases";

const { globeEnd: VEHICLE_START, vehicleEnd: VEHICLE_END } = SCENE_TRANSITIONS;
const OFFSCREEN_X = 15;
const TRUCK_Y = -1.5;

// car.glb is a 6-vehicle pack (truck1/formula1/sedan/minivan/trailer2/
// limousine) laid out side by side in one scene — "truck1" is the one
// used here; the others are never extracted so never rendered. Its own
// nose faces local +z (inferred from the frontl/frontr wheel groups
// sitting at positive z, opposite the old procedural cab's local -z). The
// -165deg rotation tuned earlier for that old model pointed the nose
// ~45deg toward the camera; +15deg (i.e. -165+180) produces the identical
// world-space facing for a model whose local nose is flipped.
const DRIVE_ROTATION_Y = (15 * Math.PI) / 180;

// truck1's raw mesh geometry is only ~5.4 units long. In the source file it
// reaches its documented ~56-unit size via an ANCESTOR's scale
// (Sketchfab_model, 0.1036) three levels up — but getObjectByName("truck1")
// below pulls it out as a detached <primitive>, which drops that ancestor
// chain, and the `scale` prop on <primitive> overwrites truck1's own local
// scale outright. Net effect: the truck was rendering at 5.4 * 0.19 * 0.85
// ≈ 0.87 world units, invisibly small (confirmed via screenshot). 2 here
// (on top of the group's own 0.85) restores the intended ~9-unit length:
// 5.4 * 2 * 0.85 ≈ 9.2.
const CAR_SCALE: [number, number, number] = [2, 2, 2];

const EXHAUST_ORIGIN = new THREE.Vector3(0.5, 1.1, 0.4);
const EXHAUST_COUNT = 12;

interface Puff {
  offset: THREE.Vector3;
  life: number;
  speed: number;
}

/** Which real GLB material names get which "premium" treatment. Anything
 * not listed here (e.g. procedural sub-materials Sketchfab sometimes
 * duplicates) just gets the shiny-metal default. */
function enhanceMaterial(mat: THREE.MeshStandardMaterial) {
  const name = mat.name.toLowerCase();
  if (name === "wheel") {
    mat.metalness = 0.2;
    mat.roughness = 0.9; // matte rubber, not shiny
  } else if (name === "window") {
    mat.metalness = 0.1;
    mat.roughness = 0.05;
    mat.transparent = true;
    mat.opacity = 0.7; // glossy glass
  } else if (name.startsWith("light")) {
    mat.emissive = mat.color.clone();
    mat.emissiveIntensity = 2.5;
    mat.metalness = 0.1;
    mat.roughness = 0.3;
  } else {
    // car_color / metal / handles / everything else: shiny body panels.
    mat.metalness = 0.8;
    mat.roughness = 0.2;
  }
  mat.transparent = true; // every material needs this for the phase-3 dissolve fade
}

/**
 * Real low-poly truck (car.glb → "truck1"), replacing the hand-built
 * primitive rig. Parked off-screen left before the vehicle scene starts,
 * drives in and stops during phases 1–2, then fades out as
 * <TruckLaptopParticles /> takes over the dissolution in phase 3.
 * Invisible from phase 4 onward.
 */
export default function Truck() {
  const groupRef = useRef<THREE.Group>(null);
  const puffMeshRef = useRef<THREE.InstancedMesh>(null);
  const wheelGroupRefs = useRef<THREE.Object3D[]>([]);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const windowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const wheelRotation = useRef(0);

  const { scene: carScene } = useGLTF("/models/car.glb");

  const truck = useMemo(() => {
    const clonedScene = carScene.clone(true);
    const truck1 = clonedScene.getObjectByName("truck1");
    if (!truck1) {
      console.error('[Truck] "truck1" not found in car.glb — check mesh names');
      return null;
    }
    // truck1 sits at a large offset within the pack's layout; re-center it
    // so it renders at this component's own local origin.
    truck1.position.set(0, 0, 0);

    const materials: THREE.MeshStandardMaterial[] = [];
    truck1.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      // Give this instance its own material (not the pack-wide shared
      // one) since opacity is animated per-frame during the dissolve.
      const mat = (
        Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
      ).clone() as THREE.MeshStandardMaterial;
      enhanceMaterial(mat);
      mesh.material = mat;
      materials.push(mat);
      if (mat.name.toLowerCase() === "window") windowMatRef.current = mat;
    });
    materialsRef.current = materials;

    wheelGroupRefs.current = ["frontl", "frontr", "rearl", "rearr"]
      .map((n) => truck1.getObjectByName(`truck1_${n}`))
      .filter((o): o is THREE.Object3D => !!o);

    return truck1;
  }, [carScene]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const puffs = useMemo<Puff[]>(
    () =>
      Array.from({ length: EXHAUST_COUNT }, (_, i) => ({
        offset: new THREE.Vector3(0, 0, 0),
        life: i / EXHAUST_COUNT,
        speed: THREE.MathUtils.randFloat(0.6, 1.1),
      })),
    [],
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const { scrollProgress } = useSiteStore.getState();

    if (scrollProgress < VEHICLE_START) {
      group.visible = false;
      group.position.set(-OFFSCREEN_X, TRUCK_Y, 0);
      if (puffMeshRef.current) puffMeshRef.current.visible = false;
      return;
    }
    if (scrollProgress >= VEHICLE_END) {
      group.visible = false;
      if (puffMeshRef.current) puffMeshRef.current.visible = false;
      return;
    }

    const { phase, t } = getPhaseInfo(scrollProgress);
    let speed = 0;
    let opacity = 1;

    if (phase === 1) {
      const ease = 1 - Math.pow(1 - t, 2);
      group.position.x = THREE.MathUtils.lerp(-OFFSCREEN_X, 0, ease);
      speed = 1 - t * 0.3;
    } else if (phase === 2) {
      group.position.x = THREE.MathUtils.lerp(0, 0, t);
      speed = Math.max(0, 0.7 * (1 - t));
    } else if (phase === 3) {
      group.position.x = 0;
      opacity = 1 - t;
      speed = 0;
    } else {
      // Phases 4–5: the truck has fully dissolved.
      group.visible = false;
      if (puffMeshRef.current) puffMeshRef.current.visible = false;
      return;
    }

    group.visible = opacity > 0.01;
    group.position.y = TRUCK_Y;
    group.rotation.y = DRIVE_ROTATION_Y;

    wheelRotation.current += speed * delta * 5;
    wheelGroupRefs.current.forEach((wheel) => {
      wheel.rotation.x = wheelRotation.current;
    });

    materialsRef.current.forEach((mat) => {
      mat.opacity = mat === windowMatRef.current ? 0.7 * opacity : opacity;
    });

    // Exhaust puffs while moving.
    const puffMesh = puffMeshRef.current;
    if (puffMesh) {
      const emitting = speed > 0.05;
      puffMesh.visible = emitting;
      if (emitting) {
        puffs.forEach((puff, i) => {
          puff.life += delta * puff.speed * 0.6;
          if (puff.life > 1) puff.life -= 1;
          const rise = puff.life * 0.8;
          const drift = -puff.life * 0.6; // trails behind the pipe
          dummy.position.set(
            EXHAUST_ORIGIN.x + Math.sin(puff.life * 6 + i) * 0.06,
            EXHAUST_ORIGIN.y + rise,
            EXHAUST_ORIGIN.z + drift,
          );
          const scale = (1 - puff.life) * 0.18;
          dummy.scale.setScalar(Math.max(0.001, scale));
          dummy.updateMatrix();
          puffMesh.setMatrixAt(i, dummy.matrix);
        });
        puffMesh.instanceMatrix.needsUpdate = true;
      }
    }

    void state;
    invalidate(); // driving/idling/dissolving — keep rendering while active
  });

  return (
    <group
      ref={groupRef}
      position={[-OFFSCREEN_X, TRUCK_Y, 0]}
      scale={[0.85, 0.85, 0.85]}
    >
      {truck && <primitive object={truck} scale={CAR_SCALE} />}

      {/* Exhaust puffs — nested so they inherit the truck's transform */}
      <instancedMesh
        ref={puffMeshRef}
        args={[undefined, undefined, EXHAUST_COUNT]}
        visible={false}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#888888" transparent opacity={0.35} />
      </instancedMesh>
    </group>
  );
}

useGLTF.preload("/models/car.glb");
