"use client";

import { motion } from "framer-motion";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";

const STATS = [
  { value: "6+", label: "Projects" },
  { value: "3+", label: "Years" },
  { value: "2", label: "Industries" },
  { value: "100%", label: "Client Satisfaction" },
];

/**
 * A minimal stats row — deliberately hidden until the truck→laptop 3D scene
 * finishes its reveal, laptop exit fade included (scrollProgress ≥ contentReveal). The old BTech/timeline
 * story now lives in that cinematic scroll sequence instead of here, so this
 * section stays invisible (and non-interactive) for all of it rather than
 * fighting the scene's own overlay text for the same screen space.
 */
export default function About() {
  const visible = useScrollThreshold(SCENE_TRANSITIONS.contentReveal);

  return (
    <section id="about" className="section-content px-6 pb-32 pt-[100px] md:px-12">
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-6"
      >
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center md:text-left">
            <span className="block font-display text-4xl font-bold text-white md:text-6xl">
              {stat.value}
            </span>
            <span className="mt-3 block font-mono text-xs uppercase tracking-[0.2em] text-white/50">
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
