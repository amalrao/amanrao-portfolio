import { SCENE_TRANSITIONS } from "./constants";

/**
 * [start, end) scrollProgress bounds for each phase of the truck→laptop
 * scene. Proportionally rescaled to fit within [0.2, vehicleEnd] whenever
 * vehicleEnd changes (see the comment on SCENE_TRANSITIONS.vehicleEnd) —
 * each phase keeps the same relative share of the cinematic, just over a
 * shorter total scroll distance.
 */
export const PHASE_BOUNDS: [number, number][] = [
  [0.2, 0.26], // 1: drive in
  [0.26, 0.3], // 2: stop
  [0.3, 0.36], // 3: dissolve
  [0.36, 0.41], // 4: reassemble
  [0.41, SCENE_TRANSITIONS.vehicleEnd], // 5: reveal (0.41–0.45)
];

export interface PhaseInfo {
  /** 0 before the scene starts, 1–5 during it, 6 once it's complete. */
  phase: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Progress within the current phase, 0–1. */
  t: number;
}

/** Maps a global scrollProgress value onto the truck→laptop scene's 5-phase timeline. */
export function getPhaseInfo(scrollProgress: number): PhaseInfo {
  if (scrollProgress < PHASE_BOUNDS[0][0]) return { phase: 0, t: 0 };
  for (let i = 0; i < PHASE_BOUNDS.length; i++) {
    const [start, end] = PHASE_BOUNDS[i];
    if (scrollProgress < end) {
      return {
        phase: (i + 1) as PhaseInfo["phase"],
        t: (scrollProgress - start) / (end - start),
      };
    }
  }
  return { phase: 6, t: 1 };
}
