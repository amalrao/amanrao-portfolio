"use client";

import { motion } from "framer-motion";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { useSiteStore } from "@/lib/store";

interface ExperienceEntry {
  org: string;
  role?: string;
  period: string;
}

const EXPERIENCE: ExperienceEntry[] = [
  {
    org: "Agile Tech Solutions Pvt. Ltd.",
    period: "Current",
  },
  {
    org: "Antrays System Ltd.",
    role: "Executive CRM",
    period: "April 2024 – September 2024",
  },
];

/** Hidden until the truck→laptop cinematic scene, including the laptop's own exit fade, finishes (scrollProgress ≥ contentReveal). */
export default function Experience() {
  const visible = useScrollThreshold(SCENE_TRANSITIONS.contentReveal);
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);

  return (
    <section
      id="experience"
      className="section-content overflow-hidden px-6 py-16 md:px-12"
    >
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className="bg-background"
      >
        <p className="mb-12 font-mono text-[9px] tracking-[0.25em] text-white/30">
          {"// experience"}
        </p>

        <div className="border-t border-[rgba(255,255,255,0.06)]">
          {EXPERIENCE.map((entry, i) => (
            <motion.div
              key={entry.org}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
              className="group border-b border-[rgba(255,255,255,0.06)] py-8"
            >
              <span className="block font-mono text-[11px] text-white/20">
                0{i + 1}
              </span>

              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <h3 className="font-display text-2xl font-bold leading-tight text-white transition-colors duration-300 ease-out group-hover:text-accent sm:text-4xl">
                    {entry.org}
                  </h3>
                  {entry.role && (
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
                      {entry.role}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-white/30">
                  {entry.period}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
