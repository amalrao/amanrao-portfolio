"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree, invalidate } from "@react-three/fiber";
import gsap from "gsap";
import * as THREE from "three";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";
import { getPhaseInfo } from "@/lib/truckLaptopPhases";

const DEFAULT_POS: [number, number, number] = [0, 2, 12];
const DEFAULT_LOOK: [number, number, number] = [0, 0, 0];
const RETURN_WIDTH = 0.05;

/**
 * Drives the shared camera through the truck→laptop scene's five phases,
 * scroll-scrubbed continuously and smoothed via gsap.quickTo (the
 * idiomatic GSAP API for repeated per-frame target updates). Outside the
 * scene it holds the default hero/globe framing, and eases back to it once
 * the dashboard scene takes over past `vehicleEnd`.
 */
export default function TruckLaptopCameraRig() {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(...DEFAULT_LOOK));
  const pos = useRef(new THREE.Vector3(...DEFAULT_POS));
  // gsap's own ticker updates pos.current/lookTarget.current every rAF tick
  // regardless of the Canvas's frameloop mode — these remember what we last
  // actually applied to the camera, so we can tell whether the tween is
  // still easing (needs another frame) or has settled (Canvas can go idle).
  const lastAppliedPos = useRef(new THREE.Vector3(...DEFAULT_POS));
  const lastAppliedLook = useRef(new THREE.Vector3(...DEFAULT_LOOK));
  const SETTLE_EPS = 0.0005;

  // Two speeds for the same tween targets: the normal 0.6s ease reads as
  // cinematic during a slow scroll, but on a fast flick it visibly lags
  // behind — the camera is still easing toward where the truck *was* a
  // half-second ago. Above a velocity threshold, snap with a much shorter
  // tween instead of letting it play catch-up.
  const quick = useMemo(() => {
    const smooth = { duration: 0.6, ease: "power2.inOut" };
    const fast = { duration: 0.12, ease: "power1.out" };
    return {
      px: gsap.quickTo(pos.current, "x", smooth),
      py: gsap.quickTo(pos.current, "y", smooth),
      pz: gsap.quickTo(pos.current, "z", smooth),
      lx: gsap.quickTo(lookTarget.current, "x", smooth),
      ly: gsap.quickTo(lookTarget.current, "y", smooth),
      lz: gsap.quickTo(lookTarget.current, "z", smooth),
      pxFast: gsap.quickTo(pos.current, "x", fast),
      pyFast: gsap.quickTo(pos.current, "y", fast),
      pzFast: gsap.quickTo(pos.current, "z", fast),
      lxFast: gsap.quickTo(lookTarget.current, "x", fast),
      lyFast: gsap.quickTo(lookTarget.current, "y", fast),
      lzFast: gsap.quickTo(lookTarget.current, "z", fast),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const { scrollProgress } = useSiteStore.getState();
    const targetPos = new THREE.Vector3(...DEFAULT_POS);
    const targetLook = new THREE.Vector3(...DEFAULT_LOOK);

    if (
      scrollProgress >= SCENE_TRANSITIONS.globeEnd &&
      scrollProgress < SCENE_TRANSITIONS.vehicleEnd
    ) {
      const { phase, t } = getPhaseInfo(scrollProgress);

      switch (phase) {
        case 1: {
          // Truck drives in from x=-15 toward x=0 (see Truck.tsx) — hold a
          // fixed, centered framing so it stays clearly in view the whole
          // approach instead of panning off with it. Pulled back and raised
          // versus the original (0,3,12)/(0,0,0) framing so the truck's roof
          // clears the fixed navbar with margin instead of clipping behind it.
          targetPos.set(0, 3.8, 14.5);
          targetLook.set(0, -0.3, 0);
          break;
        }
        case 2: {
          // Truck stopped — same fixed framing as phase 1, so there's no
          // camera jump at the moment it comes to a stop.
          targetPos.set(0, 3.8, 14.5);
          targetLook.set(0, -0.3, 0);
          break;
        }
        case 3: {
          // Dissolution — pull back.
          targetPos.set(-1, 1.2, THREE.MathUtils.lerp(10, 14, t));
          targetLook.set(0, -0.5, 0);
          break;
        }
        case 4: {
          // Reassembly — move back to front-facing.
          targetPos.set(
            THREE.MathUtils.lerp(-1, 0, t),
            THREE.MathUtils.lerp(1.2, 1, t),
            THREE.MathUtils.lerp(14, 9, t),
          );
          targetLook.set(0, 0, 0);
          break;
        }
        case 5: {
          // Reveal — pull back and look toward the laptop's off-center position.
          targetPos.set(0, 1.5, 11);
          targetLook.set(2, 0.5, 0);
          break;
        }
        default:
          break;
      }
    } else if (scrollProgress >= SCENE_TRANSITIONS.vehicleEnd) {
      // Dashboard scene — ease back to the default framing.
      const backT = THREE.MathUtils.clamp(
        (scrollProgress - SCENE_TRANSITIONS.vehicleEnd) / RETURN_WIDTH,
        0,
        1,
      );
      targetPos.lerpVectors(
        new THREE.Vector3(0, 1.5, 11),
        new THREE.Vector3(...DEFAULT_POS),
        backT,
      );
      targetLook.lerpVectors(
        new THREE.Vector3(2, 0.5, 0),
        new THREE.Vector3(...DEFAULT_LOOK),
        backT,
      );
    }

    const fastScroll = useSiteStore.getState().scrollVelocity > 0.01;
    if (fastScroll) {
      quick.pxFast(targetPos.x);
      quick.pyFast(targetPos.y);
      quick.pzFast(targetPos.z);
      quick.lxFast(targetLook.x);
      quick.lyFast(targetLook.y);
      quick.lzFast(targetLook.z);
    } else {
      quick.px(targetPos.x);
      quick.py(targetPos.y);
      quick.pz(targetPos.z);
      quick.lx(targetLook.x);
      quick.ly(targetLook.y);
      quick.lz(targetLook.z);
    }

    camera.position.copy(pos.current);
    camera.lookAt(lookTarget.current);

    // Canvas is frameloop="demand": only ask for another frame while the
    // gsap tween is still visibly moving the camera. Once it settles at
    // rest (e.g. holding the default hero framing, or parked at a fully
    // scrolled-past phase target), stop — there's nothing new to draw.
    const stillEasing =
      lastAppliedPos.current.distanceToSquared(pos.current) > SETTLE_EPS ||
      lastAppliedLook.current.distanceToSquared(lookTarget.current) >
        SETTLE_EPS;
    if (stillEasing) {
      lastAppliedPos.current.copy(pos.current);
      lastAppliedLook.current.copy(lookTarget.current);
      invalidate();
    }
  });

  return null;
}
