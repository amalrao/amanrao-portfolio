"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree, invalidate } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS, SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const { vehicleEnd: DASHBOARD_START } = SCENE_TRANSITIONS;
// ENTRY_FADE_WIDTH and EXIT_HIDE_AT unchanged from the earlier tuning pass —
// EXIT_HIDE_AT in particular is what keeps this element fully faded before
// Services/About/Experience (see SCENE_TRANSITIONS.contentReveal in
// lib/constants.ts) are substantially scrolled into view; not touched here.
// EXIT_FADE_START nudged from 0.48 to 0.485 for a slightly longer hold at
// full visibility once the laptop is established, and the old visibility
// formula snapped straight to 0 the instant scrollProgress crossed
// EXIT_FADE_START rather than actually fading — see the eased exitVisibility
// below, which now ramps smoothly across [EXIT_FADE_START, EXIT_HIDE_AT].
const ENTRY_FADE_WIDTH = 0.03;
const EXIT_FADE_START = 0.485;
const EXIT_HIDE_AT = 0.5;

function digitalSystemVisibility(scrollProgress: number) {
  const entryVisibility = THREE.MathUtils.clamp(
    (scrollProgress - DASHBOARD_START) / ENTRY_FADE_WIDTH,
    0,
    1,
  );
  const exitVisibility = THREE.MathUtils.clamp(
    (EXIT_HIDE_AT - scrollProgress) / (EXIT_HIDE_AT - EXIT_FADE_START),
    0,
    1,
  );
  return Math.min(entryVisibility, exitVisibility);
}

const ACCENT = "#00FF85";

const NODE_COUNT_DESKTOP = 8;
// Was 5 — trimmed slightly further so the sparser desktop density reads
// appropriately for a smaller, more contained mobile cluster.
const NODE_COUNT_MOBILE = 4;
const FRAGMENT_COUNT_DESKTOP = 3;
const FRAGMENT_COUNT_MOBILE = 2;
// Mobile-only node radius and cluster spread (viewportWidth < 768). Desktop
// keeps the original 0.06 radius / 1.7×1.3×1.4 spread exactly as before.
const NODE_RADIUS_DESKTOP = 0.06;
const NODE_RADIUS_MOBILE = 0.045;
const SPREAD_DESKTOP: [number, number, number] = [1.7, 1.3, 1.4];
const SPREAD_MOBILE: [number, number, number] = [1.0, 0.8, 0.9];

/**
 * A tiny emissive marker that loops slowly along one node-to-node
 * connection — "1-2 very subtle flowing data connections" per the design
 * pass, reusing the same self-contained visibility-gating pattern as the
 * nodes/fragments below rather than depending on parent render order.
 */
function FlowDot({
  from,
  to,
  speedOffset,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  speedOffset: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    const { scrollProgress } = useSiteStore.getState();
    if (scrollProgress < DASHBOARD_START || scrollProgress > EXIT_HIDE_AT) {
      mesh.visible = false;
      return;
    }

    const visibility = digitalSystemVisibility(scrollProgress);
    mesh.visible = visibility > 0.01;
    if (!mesh.visible) return;

    // Extremely slow, restrained loop — one full traversal roughly every 9s.
    const t = (state.clock.elapsedTime * 0.11 + speedOffset) % 1;
    mesh.position.lerpVectors(from, to, t);
    mat.opacity = visibility * 0.55;
    invalidate();
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.025, 5, 5]} />
      <meshStandardMaterial
        ref={matRef}
        color={ACCENT}
        emissive={ACCENT}
        emissiveIntensity={1.5}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

interface DashboardProps {
  position?: [number, number, number];
}

/**
 * Sparse "digital system / data flow" motif — a handful of floating data
 * nodes, a few thin connecting lines, and a couple of small technical
 * fragments. Replaces the old red bar-chart dashboard: automobile
 * engineering → software → data systems, kept deliberately minimal so the
 * laptop (components/canvas/Laptop.tsx) stays the primary visual — this
 * mounts well off to its side (see the position prop passed in Scene.tsx).
 * Same visibility timing as before: hidden until `DASHBOARD_START`, fades
 * in over `ENTRY_FADE_WIDTH`, briefly holds, then fades out.
 */
export default function Dashboard({ position = [0, 0, 0] }: DashboardProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodeMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null);
  const fragmentMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  const viewportWidth = useThree((state) => state.size.width);
  const isMobile = viewportWidth < 768;
  const nodeCount = isMobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP;
  const fragmentCount = isMobile
    ? FRAGMENT_COUNT_MOBILE
    : FRAGMENT_COUNT_DESKTOP;

  const spread = isMobile ? SPREAD_MOBILE : SPREAD_DESKTOP;
  const nodePositions = useMemo(
    () =>
      Array.from(
        { length: nodeCount },
        () =>
          new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(spread[0]),
            THREE.MathUtils.randFloatSpread(spread[1]),
            THREE.MathUtils.randFloatSpread(spread[2]),
          ),
      ),
    [nodeCount, spread],
  );

  const nodePulseSeeds = useMemo(
    () => nodePositions.map(() => Math.random() * Math.PI * 2),
    [nodePositions],
  );

  // Sparse, non-overlapping neighbor pairs plus one cross-link — a network
  // hint, not a fully-meshed graph, to keep density low.
  const connections = useMemo(() => {
    const pairs: [number, number][] = [];
    for (let i = 0; i < nodeCount - 1; i += 2) pairs.push([i, i + 1]);
    if (nodeCount >= 4) pairs.push([1, nodeCount - 2]);
    return pairs;
  }, [nodeCount]);

  // First 1-2 connections carry a slow flowing marker — kept to a small
  // fixed subset, not every line, to stay "very subtle."
  const flowConnections = useMemo(
    () => connections.slice(0, Math.min(2, connections.length)),
    [connections],
  );

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(connections.length * 6);
    connections.forEach(([a, b], i) => {
      positions.set(nodePositions[a].toArray(), i * 6);
      positions.set(nodePositions[b].toArray(), i * 6 + 3);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    return geometry;
  }, [connections, nodePositions]);

  const fragments = useMemo(
    () =>
      Array.from({ length: fragmentCount }, (_, i) => {
        const anchor = nodePositions[(i * 2 + 1) % nodePositions.length];
        return {
          position: anchor
            .clone()
            .add(
              new THREE.Vector3(
                THREE.MathUtils.randFloatSpread(0.3),
                THREE.MathUtils.randFloatSpread(0.3),
                THREE.MathUtils.randFloatSpread(0.3),
              ),
            ),
          rotation: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
          ),
        };
      }),
    [fragmentCount, nodePositions],
  );

  useFrame((state) => {
    const { scrollProgress } = useSiteStore.getState();
    const group = groupRef.current;
    if (!group) return;

    if (scrollProgress < DASHBOARD_START || scrollProgress > EXIT_HIDE_AT) {
      group.visible = false;
      return;
    }

    const visibility = digitalSystemVisibility(scrollProgress);
    group.visible = visibility > 0.01;
    group.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;

    nodeMatRefs.current.forEach((mat, i) => {
      if (!mat) return;
      const pulse =
        1 + Math.sin(state.clock.elapsedTime * 1.8 + nodePulseSeeds[i]) * 0.15;
      mat.opacity = visibility;
      // Was 1.4 * pulse — a further small bump for readability, still modest.
      mat.emissiveIntensity = 1.6 * pulse;
    });
    // Was 0.55 — a further small bump so the lines stay legible alongside
    // the brighter nodes above, still thin/subtle.
    if (lineMatRef.current) lineMatRef.current.opacity = visibility * 0.65;
    fragmentMatRefs.current.forEach((mat) => {
      if (mat) mat.opacity = visibility * 0.7;
    });

    invalidate(); // node pulse + cluster sway — keep rendering while visible
  });

  return (
    <group ref={groupRef} position={position}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          ref={lineMatRef}
          color={ACCENT}
          transparent
          opacity={0}
        />
      </lineSegments>

      {nodePositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          {/* Was 0.05 — a small bump alongside the brightness increase above
              helps the nodes read at a glance without becoming a focal object.
              Mobile gets its own smaller radius (NODE_RADIUS_MOBILE); desktop
              keeps NODE_RADIUS_DESKTOP (0.06) exactly as before. */}
          <sphereGeometry
            args={[isMobile ? NODE_RADIUS_MOBILE : NODE_RADIUS_DESKTOP, 6, 6]}
          />
          <meshStandardMaterial
            ref={(m) => {
              if (m) nodeMatRefs.current[i] = m;
            }}
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={1}
            transparent
            opacity={0}
          />
        </mesh>
      ))}

      {flowConnections.map(([a, b], i) => (
        <FlowDot
          key={`flow-${a}-${b}`}
          from={nodePositions[a]}
          to={nodePositions[b]}
          speedOffset={i * 0.5}
        />
      ))}

      {fragments.map((f, i) => (
        <mesh key={i} position={f.position} rotation={f.rotation}>
          <boxGeometry args={[0.16, 0.1, 0.015]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) fragmentMatRefs.current[i] = m;
            }}
            color={COLORS.secondary}
            emissive={ACCENT}
            emissiveIntensity={0.25}
            metalness={0.3}
            roughness={0.6}
            transparent
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}
