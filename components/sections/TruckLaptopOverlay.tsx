"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSiteStore } from "@/lib/store";

interface TextBlock {
  eyebrow?: string;
  headline: string[];
  small?: string;
  // CSS length/clamp() string rather than a bare number — phases 1 and 5
  // each hold a single long line of copy with no per-viewport break, so a
  // fixed desktop pixel size (the old 32/48) wrapped awkwardly on narrow
  // phones. clamp()'s own upper bound reproduces the exact old desktop
  // value once the viewport is wide enough for the vw term to exceed it,
  // so desktop is unaffected; only narrow viewports get the smaller end.
  size?: string;
}

const PHASE_TEXT: Record<number, TextBlock> = {
  1: {
    headline: ["started with engines."],
    small: "BTech — 2023",
    size: "clamp(22px, 7vw, 32px)",
  },
  2: {
    eyebrow: "WHERE IT STARTED",
    headline: ["BTECH. ENGINES.", "PRECISION."],
  },
  5: {
    headline: ["now i write code."],
    small: "full stack · data · python",
    size: "clamp(24px, 8vw, 48px)",
  },
};

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Bottom-left text overlay for the truck→laptop cinematic scene. Reads the
 * current phase from the zustand store (written by <TruckPhaseReporter />)
 * and cross-fades the matching copy block in and out.
 */
export default function TruckLaptopOverlay() {
  const phase = useSiteStore((state) => state.truckPhase);
  const block = PHASE_TEXT[phase];

  return (
    <div className="pointer-events-none fixed bottom-16 left-6 z-20 max-w-md md:left-12">
      <AnimatePresence mode="wait">
        {block && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {block.eyebrow && (
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                {block.eyebrow}
              </p>
            )}
            <h3
              className="font-display text-3xl font-bold leading-[0.95] text-white md:text-5xl"
              style={block.size ? { fontSize: block.size } : undefined}
            >
              {block.headline.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h3>
            {block.small && (
              <p className="mt-3 font-mono text-xs tracking-[0.15em] text-white/50">
                {block.small}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
