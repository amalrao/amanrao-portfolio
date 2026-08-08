"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, invalidate } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import * as THREE from "three";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const { globeEnd: GLOBE_END } = SCENE_TRANSITIONS;
// Was 0.1 — that kept the globe rendering at meaningful opacity through the
// end of the truck's drive-in AND stop phases (see PHASE_BOUNDS in
// lib/truckLaptopPhases.ts), so two large focal objects shared the frame at
// once. 0.04 gets it substantially faded before the truck becomes the
// dominant subject.
const FADE_WIDTH = 0.04;
const BASE_SCALE = 0.75;
// Mobile-only overrides (viewportWidth < 768, see isMobile below). Desktop
// keeps BASE_SCALE and the `position` prop's x (5.5) exactly as before —
// these two constants are never read outside the isMobile branch.
// On a narrow portrait aspect ratio the camera's fixed 55deg vertical FOV
// (see Scene.tsx) yields a much narrower horizontal FOV, so x=5.5 sits well
// outside the visible frustum. MOBILE_X pulls it near-center instead, and
// MOBILE_SCALE_MULT shrinks it further so it reads as an intentional small
// companion object next to the hero text rather than a cropped desktop scene.
const MOBILE_SCALE_MULT = 0.5;
const MOBILE_X = 0.75;

const ACCENT = "#00FF85";
const METAL = "#1A1A1E";

const CORE_RADIUS = 2.2;
const COMPONENT_RADIUS = 2.9;
const COMPONENT_COUNT_DESKTOP = 20;
const COMPONENT_COUNT_MOBILE = 10;

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * A single "digital node" marker at one of the core's vertices. Scales/fades
 * in as the mechanical shell dissolves into wireframe, then holds a gentle
 * pulse — same technique as the old city-pin markers, just repositioned.
 */
function Node({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const { scrollProgress } = useSiteStore.getState();
    if (scrollProgress >= GLOBE_END + FADE_WIDTH) return;

    const formT = THREE.MathUtils.clamp(scrollProgress / GLOBE_END, 0, 1);
    const appear = smoothstep(0.3, 0.65, formT);
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2.5 + phase) * 0.25;
    mesh.scale.setScalar(appear * pulse);
    mat.opacity = appear;
    invalidate(); // pulse — keep rendering while any node is visible
  });

  return (
    <mesh ref={meshRef} position={position} scale={0}>
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshStandardMaterial
        ref={matRef}
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={1.6}
        transparent
        opacity={0}
      />
    </mesh>
  );
}

/**
 * Radial cluster of short bars suggesting engineered components (bolts,
 * brackets — never a literal gear tooth profile). Present at full opacity
 * in the mechanical phase, fades out early in the transformation as
 * <DigitalMotes /> takes over the same silhouette as scattering particles.
 */
function EngineeredComponents({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const layout = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 0.6,
      })),
    [count],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const { scrollProgress } = useSiteStore.getState();
    if (scrollProgress >= GLOBE_END + FADE_WIDTH) {
      mesh.visible = false;
      return;
    }

    const formT = THREE.MathUtils.clamp(scrollProgress / GLOBE_END, 0, 1);
    const presence = 1 - smoothstep(0, 0.4, formT);
    mesh.visible = presence > 0.01;
    if (!mesh.visible) return;
    mat.opacity = presence * 0.85;

    layout.forEach((c, i) => {
      dummy.position.set(
        Math.cos(c.angle) * COMPONENT_RADIUS,
        Math.sin(c.tilt) * 0.7,
        Math.sin(c.angle) * COMPONENT_RADIUS,
      );
      dummy.rotation.set(0, -c.angle, c.tilt);
      dummy.scale.setScalar(presence);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    invalidate(); // fading out during the transformation window
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[0.18, 0.6, 0.16]} />
      <meshStandardMaterial
        ref={matRef}
        color={METAL}
        metalness={0.6}
        roughness={0.4}
        transparent
        opacity={0}
      />
    </instancedMesh>
  );
}

interface Mote {
  origin: THREE.Vector3;
  driftDir: THREE.Vector3;
  driftDistance: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitPhase: number;
}

/**
 * Small instanced-particle cloud that echoes <EngineeredComponents />
 * dissolving: starts at the same radial positions, drifts outward and
 * shifts grey → accent green through the transformation window, then
 * settles into a slow, low-amplitude orbit — the "flowing particles" of
 * the digital phase, not a one-shot burst.
 */
function DigitalMotes({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const GREY = useMemo(() => new THREE.Color(METAL), []);
  const GREEN = useMemo(() => new THREE.Color(ACCENT), []);

  const motes = useMemo<Mote[]>(
    () =>
      Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        return {
          origin: new THREE.Vector3(
            Math.cos(angle) * COMPONENT_RADIUS,
            (Math.random() - 0.5) * 0.7,
            Math.sin(angle) * COMPONENT_RADIUS,
          ),
          driftDir: new THREE.Vector3(
            Math.cos(angle),
            (Math.random() - 0.5) * 0.6,
            Math.sin(angle),
          ).normalize(),
          driftDistance: THREE.MathUtils.randFloat(0.6, 1.6),
          orbitRadius: THREE.MathUtils.randFloat(2.9, 3.8),
          orbitSpeed: THREE.MathUtils.randFloat(0.15, 0.35),
          orbitPhase: Math.random() * Math.PI * 2,
        };
      }),
    [count],
  );

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const { scrollProgress } = useSiteStore.getState();
    if (scrollProgress >= GLOBE_END + FADE_WIDTH) {
      mesh.visible = false;
      return;
    }

    const formT = THREE.MathUtils.clamp(scrollProgress / GLOBE_END, 0, 1);
    const scatter = smoothstep(0.2, 0.6, formT);
    mesh.visible = scatter > 0.01;
    if (!mesh.visible) return;

    const color = GREY.clone().lerp(GREEN, scatter);
    mat.emissive.copy(color);
    mat.opacity = scatter * 0.8;

    motes.forEach((m, i) => {
      const settled = m.origin
        .clone()
        .add(m.driftDir.clone().multiplyScalar(m.driftDistance * scatter));
      const orbitT = state.clock.elapsedTime * m.orbitSpeed + m.orbitPhase;
      const orbit = new THREE.Vector3(
        Math.cos(orbitT) * m.orbitRadius,
        Math.sin(orbitT * 0.7) * 0.4,
        Math.sin(orbitT) * m.orbitRadius,
      );
      dummy.position.lerpVectors(settled, orbit, scatter * 0.5);
      dummy.scale.setScalar(0.5 + scatter * 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    invalidate(); // drift/orbit — keep rendering while visible
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.045, 5, 5]} />
      <meshStandardMaterial
        ref={matRef}
        color="white"
        emissive={ACCENT}
        emissiveIntensity={1.2}
        roughness={0.4}
        metalness={0}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

interface GlobeProps {
  position?: [number, number, number];
}

/**
 * Abstract "mechanical → digital" transformation piece — anchors the hero's
 * right side. A faceted engineering-inspired core (rings + radial
 * component bars, dark metal) continuously dissolves into a wireframe +
 * connected-node network as the page scrolls, visualizing the site's
 * automobile-engineering → software-engineering story. Replaces the former
 * geographic globe; keeps the same mount contract, position prop, and
 * scroll-driven visibility/fade/spring behavior.
 */
export default function Globe({ position = [5.5, 0, -2] }: GlobeProps) {
  const outerRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const wireMatRef = useRef<THREE.LineBasicMaterial>(null);
  const ring1MatRef = useRef<THREE.MeshStandardMaterial>(null);
  const ring2MatRef = useRef<THREE.MeshStandardMaterial>(null);

  const viewportWidth = useThree((state) => state.size.width);
  const isMobile = viewportWidth < 768;
  const mobileScale = (isMobile ? MOBILE_SCALE_MULT : 1) * BASE_SCALE;
  const componentCount = isMobile
    ? COMPONENT_COUNT_MOBILE
    : COMPONENT_COUNT_DESKTOP;

  const [visibility, setVisibility] = useState(1);

  useEffect(() => {
    const unsubscribe = useSiteStore.subscribe((state, prevState) => {
      if (state.scrollProgress === prevState.scrollProgress) return;
      const progress = state.scrollProgress;
      const next =
        progress < GLOBE_END
          ? 1
          : THREE.MathUtils.clamp(1 - (progress - GLOBE_END) / FADE_WIDTH, 0, 1);
      setVisibility(next);
    });
    return unsubscribe;
  }, []);

  // Only used for its interpolated values (read via .get() in useFrame)
  // rather than as an <animated> JSX wrapper — react-spring/three's
  // animated() Object3D wrapper leaves matrixWorld's translation as NaN
  // indefinitely in this r3f setup, silently making the group invisible.
  // Driving the plain group's transform imperatively avoids that entirely.
  const springs = useSpring({
    scale: visibility * mobileScale,
    x: isMobile ? MOBILE_X : position[0],
    config: { mass: 1, tension: 120, friction: 26 },
  });

  // Built once from an IcosahedronGeometry: a faceted (not spherical) core
  // for the mechanical phase, its exact wireframe for the digital phase,
  // and its 12 unique vertices reused as <Node /> positions — one shape
  // continuously reinterpreted, rather than two unrelated objects swapped.
  const coreGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(CORE_RADIUS, 0),
    [],
  );
  const wireGeometry = useMemo(
    () => new THREE.WireframeGeometry(coreGeometry),
    [coreGeometry],
  );
  const nodePositions = useMemo(() => {
    const posAttr = coreGeometry.attributes.position;
    const unique: THREE.Vector3[] = [];
    const tmp = new THREE.Vector3();
    for (let i = 0; i < posAttr.count; i++) {
      tmp.fromBufferAttribute(posAttr, i);
      if (!unique.some((v) => v.distanceToSquared(tmp) < 0.0001)) {
        unique.push(tmp.clone());
      }
    }
    return unique;
  }, [coreGeometry]);

  // coreGeometry/wireGeometry are built with `new THREE.*Geometry(...)`
  // outside JSX, so — unlike JSX-declared geometries, which r3f disposes
  // automatically on unmount — they need explicit disposal here.
  useEffect(() => {
    return () => {
      coreGeometry.dispose();
      wireGeometry.dispose();
    };
  }, [coreGeometry, wireGeometry]);

  useFrame((_, delta) => {
    const outer = outerRef.current;
    if (!outer) return;
    const scale = springs.scale.get();
    outer.position.x = springs.x.get();
    outer.scale.setScalar(scale);
    // Fully cull once faded out, rather than leaving a zero-scale draw call.
    outer.visible = scale > 0.01;
    if (!outer.visible) return; // skip spin/material updates while hidden

    if (spinRef.current) spinRef.current.rotation.y += delta * 0.1;
    if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 0.15;
    if (ring2Ref.current) ring2Ref.current.rotation.y -= delta * 0.2;

    const { scrollProgress } = useSiteStore.getState();
    const formT = THREE.MathUtils.clamp(scrollProgress / GLOBE_END, 0, 1);

    if (coreMatRef.current) {
      coreMatRef.current.opacity = 1 - smoothstep(0.1, 0.55, formT);
    }
    if (wireMatRef.current) {
      wireMatRef.current.opacity = smoothstep(0.15, 0.55, formT) * 0.6;
    }
    // Rings persist through every phase — full presence for the mechanical
    // "assembly" read, settling to a faint ambient halo once digital.
    const ringOpacity = THREE.MathUtils.lerp(0.18, 0.06, smoothstep(0, 1, formT));
    if (ring1MatRef.current) ring1MatRef.current.opacity = ringOpacity;
    if (ring2MatRef.current) ring2MatRef.current.opacity = ringOpacity * 0.8;

    invalidate(); // ambient spin + phase blend — keep rendering while visible
  });

  return (
    <group ref={outerRef} position={position}>
      <group ref={spinRef}>
        {/* Mechanical core — dissolves into the wireframe below as the page scrolls. */}
        <mesh geometry={coreGeometry}>
          <meshStandardMaterial
            ref={coreMatRef}
            color={METAL}
            metalness={0.75}
            roughness={0.3}
            emissive={ACCENT}
            emissiveIntensity={0.08}
            transparent
            opacity={1}
          />
        </mesh>

        {/* Digital network — the same core's exact edges, read as connecting lines between the nodes below. */}
        <lineSegments geometry={wireGeometry}>
          <lineBasicMaterial ref={wireMatRef} color={ACCENT} transparent opacity={0} />
        </lineSegments>

        {nodePositions.map((pos, i) => (
          <Node key={i} position={pos} />
        ))}

        {/* Orbital rings — mechanical assembly accent, settles to a faint halo once digital. */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.15, 0.025, 6, 48]} />
          <meshStandardMaterial
            ref={ring1MatRef}
            color={ACCENT}
            transparent
            opacity={0.18}
            emissive={ACCENT}
            emissiveIntensity={0.8}
          />
        </mesh>
        <mesh
          ref={ring2Ref}
          rotation={[Math.PI / 2 + Math.PI / 6, Math.PI / 8, 0]}
        >
          <torusGeometry args={[3.5, 0.018, 6, 48]} />
          <meshStandardMaterial
            ref={ring2MatRef}
            color={ACCENT}
            transparent
            opacity={0.14}
            emissive={ACCENT}
            emissiveIntensity={0.5}
          />
        </mesh>

        <EngineeredComponents count={componentCount} />
        <DigitalMotes count={componentCount} />
      </group>
    </group>
  );
}
