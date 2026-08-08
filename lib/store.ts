import { create } from "zustand";

interface SiteState {
  /** Overall page scroll progress, 0 (top) → 1 (bottom). */
  scrollProgress: number;
  /** abs(progress delta) from the previous scroll event — used to snap
   * inertia-based tweens (e.g. the truck→laptop camera rig) instead of
   * letting them visibly lag behind a fast scroll flick. */
  scrollVelocity: number;
  setScrollProgress: (progress: number, velocity?: number) => void;

  /** Truck→laptop cinematic scene: 0 before it starts, 1–5 during, 6 once done. */
  truckPhase: number;
  /** Progress within the current truck phase, 0–1. */
  truckPhaseT: number;
  setTruckPhase: (phase: number, t: number) => void;

  isMenuOpen: boolean;
  toggleMenu: () => void;
  setMenuOpen: (open: boolean) => void;

  cursorVariant: "default" | "hover" | "text";
  setCursorVariant: (variant: SiteState["cursorVariant"]) => void;
}

export const useSiteStore = create<SiteState>((set) => ({
  scrollProgress: 0,
  scrollVelocity: 0,
  setScrollProgress: (progress, velocity = 0) =>
    set({ scrollProgress: progress, scrollVelocity: velocity }),

  truckPhase: 0,
  truckPhaseT: 0,
  setTruckPhase: (phase, t) => set({ truckPhase: phase, truckPhaseT: t }),

  isMenuOpen: false,
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  setMenuOpen: (open) => set({ isMenuOpen: open }),

  cursorVariant: "default",
  setCursorVariant: (variant) => set({ cursorVariant: variant }),
}));
