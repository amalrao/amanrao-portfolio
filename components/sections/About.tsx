"use client";

import { motion } from "framer-motion";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";

const STATS = [
  { value: "5+", label: "Projects" },
  { value: "3+", label: "Years" },
  { value: "2", label: "Industries" },
];

/**
 * Bio + stats row — deliberately hidden until the truck→laptop 3D scene
 * finishes its reveal, laptop exit fade included (scrollProgress ≥ contentReveal). The old BTech/timeline
 * story still lives in that cinematic scroll sequence too; this section adds
 * the accessible, non-scroll-gated version of it. `bg-background` on the
 * animated wrapper keeps the fixed 3D Dashboard panel (components/canvas/Dashboard.tsx)
 * from bleeding through behind this content, same fix already applied to
 * Projects/Testimonial.
 */
export default function About() {
  const visible = useScrollThreshold(SCENE_TRANSITIONS.contentReveal);

  return (
    <section id="about" className="section-content px-6 pb-32 pt-[100px] md:px-12">
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className="bg-background"
      >
        <p className="max-w-[560px] font-body text-[15px] leading-relaxed text-white/60">
          I&apos;m a full-stack developer and data-focused engineer based in Noida,
          India, working across React, Next.js, FastAPI, and Python to build and
          automate end-to-end products. Before writing code, I trained as an
          automobile engineer — that background still shows up in how I
          approach systems: precise, mechanical, built to hold up under real
          use.
        </p>

        <div className="mt-12 grid grid-cols-3 gap-6 md:gap-10">
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
        </div>
      </motion.div>
    </section>
  );
}
