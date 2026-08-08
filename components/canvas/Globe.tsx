"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, invalidate } from "@react-three/fiber";
import { useSpring } from "@react-spring/three";
import * as THREE from "three";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const { globeEnd: GLOBE_END } = SCENE_TRANSITIONS;
const FADE_WIDTH = 0.1;
const BASE_SCALE = 0.75;

const ACCENT = "#00FF85";
const OCEAN = "#0A2240";

interface City {
  name: string;
  position: [number, number, number];
}

const CITIES: City[] = [
  { name: "Bhopal", position: [1.2, 0.8, 3.7] },
  { name: "Delhi", position: [1.3, 1.1, 3.6] },
  { name: "Dubai", position: [0.8, 0.6, 3.9] },
  { name: "Singapore", position: [1.8, -0.2, 3.5] },
  { name: "London", position: [-0.5, 1.8, 3.5] },
  { name: "Sydney", position: [2.2, -2.0, 2.8] },
];

const CITY_POSITIONS: Record<string, [number, number, number]> =
  Object.fromEntries(CITIES.map((city) => [city.name, city.position]));

const ARC_CONNECTIONS: [string, string][] = [
  ["Bhopal", "Dubai"],
  ["Dubai", "London"],
  ["Bhopal", "Singapore"],
  ["Singapore", "Sydney"],
  ["Delhi", "London"],
];

function buildArcCurve(
  from: [number, number, number],
  to: [number, number, number],
) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const mid = start
    .clone()
    .add(end)
    .multiplyScalar(0.5)
    .multiplyScalar(1.4);
  return new THREE.QuadraticBezierCurve3(start, mid, end);
}

/** A pulsing location marker. */
function Pin({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    // Pin/Arc live inside the globe's group, whose own useFrame culls it
    // (`.visible = false`) once scrolled past — but a parent's `.visible`
    // doesn't stop React Three Fiber from still calling child useFrame
    // hooks every frame. Skip the pulse math once the globe itself is
    // faded out instead of animating an invisible mesh forever.
    if (useSiteStore.getState().scrollProgress >= GLOBE_END + FADE_WIDTH) return;
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2.5 + phase) * 0.35;
    meshRef.current.scale.setScalar(scale);
    invalidate(); // Canvas is frameloop="demand" — keep the pulse alive
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.08, 5, 5]} />
      <meshStandardMaterial
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={1.5}
      />
    </mesh>
  );
}

/** A glowing tube arcing between two cities, with a bright dash traveling along it. */
function Arc({
  from,
  to,
  speedOffset,
}: {
  from: [number, number, number];
  to: [number, number, number];
  speedOffset: number;
}) {
  const curve = useMemo(() => buildArcCurve(from, to), [from, to]);
  const dashRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!dashRef.current) return;
    if (useSiteStore.getState().scrollProgress >= GLOBE_END + FADE_WIDTH) return;
    const t = (state.clock.elapsedTime * 0.25 + speedOffset) % 1;
    dashRef.current.position.copy(curve.getPointAt(t));
    invalidate(); // keep the traveling dash animating on demand-mode Canvas
  });

  return (
    <>
      <mesh>
        <tubeGeometry args={[curve, 15, 0.02, 4, false]} />
        <meshStandardMaterial
          color={ACCENT}
          transparent
          opacity={0.3}
          emissive={ACCENT}
          emissiveIntensity={0.8}
        />
      </mesh>
      <mesh ref={dashRef}>
        <sphereGeometry args={[0.06, 4, 4]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={3}
        />
      </mesh>
    </>
  );
}

interface GlobeProps {
  position?: [number, number, number];
}

/** Interactive, orbit-ringed globe with pulsing city pins and flight-path arcs — anchors the hero's right side. */
export default function Globe({ position = [5.5, 0, -2] }: GlobeProps) {
  const outerRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  const viewportWidth = useThree((state) => state.size.width);
  const mobileScale = (viewportWidth < 768 ? 0.9 : 1) * BASE_SCALE;

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
    x: position[0],
    config: { mass: 1, tension: 120, friction: 26 },
  });

  useFrame((_, delta) => {
    const outer = outerRef.current;
    if (!outer) return;
    const scale = springs.scale.get();
    outer.position.x = springs.x.get();
    outer.scale.setScalar(scale);
    // Fully cull once faded out, rather than leaving a zero-scale draw call.
    outer.visible = scale > 0.01;
    if (!outer.visible) return; // skip spin/ring updates while hidden

    if (spinRef.current) spinRef.current.rotation.y += delta * 0.08;
    if (ring1Ref.current) ring1Ref.current.rotation.y += delta * 0.15;
    if (ring2Ref.current) ring2Ref.current.rotation.y -= delta * 0.2;
    invalidate(); // ambient spin — keep rendering every frame while visible
  });

  return (
    <group ref={outerRef} position={position}>
      <group ref={spinRef}>
        {/* Ocean sphere */}
        <mesh>
          <sphereGeometry args={[4, 20, 20]} />
          <meshPhysicalMaterial color={OCEAN} metalness={0.3} roughness={0.5} />
        </mesh>

        {/* Wireframe overlay removed — a full second sphere drawn in line
            mode at 0.18 opacity, barely visible at the globe's on-screen
            size, wasn't worth its own draw call. */}

        {/* Soft atmospheric glow */}
        <mesh scale={1.08}>
          <sphereGeometry args={[4, 20, 20]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0.03}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Equatorial orbital ring — subtle wireframe accent, not a bold band */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.6, 0.03, 6, 48]} />
          <meshStandardMaterial
            color={ACCENT}
            transparent
            opacity={0.15}
            emissive={ACCENT}
            emissiveIntensity={1}
          />
        </mesh>

        {/* Angled orbital ring */}
        <mesh
          ref={ring2Ref}
          rotation={[Math.PI / 2 + Math.PI / 6, Math.PI / 8, 0]}
        >
          <torusGeometry args={[5.1, 0.02, 6, 48]} />
          <meshStandardMaterial
            color={ACCENT}
            transparent
            opacity={0.15}
            emissive={ACCENT}
            emissiveIntensity={0.6}
          />
        </mesh>

        {CITIES.map((city) => (
          <Pin key={city.name} position={city.position} />
        ))}

        {ARC_CONNECTIONS.map(([from, to], i) => (
          <Arc
            key={`${from}-${to}`}
            from={CITY_POSITIONS[from]}
            to={CITY_POSITIONS[to]}
            speedOffset={i * 0.18}
          />
        ))}
      </group>
    </group>
  );
}
