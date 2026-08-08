"use client";

import { motion } from "framer-motion";
import { SERVICES, SCENE_TRANSITIONS } from "@/lib/constants";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { useSiteStore } from "@/lib/store";

/** Hidden until the truck→laptop cinematic scene, including the laptop's own exit fade, finishes (scrollProgress ≥ contentReveal). */
export default function Services() {
  const visible = useScrollThreshold(SCENE_TRANSITIONS.contentReveal);
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);

  return (
    <section
      id="services"
      className="section-content min-h-[100vh] overflow-hidden px-6 py-16 md:px-12"
    >
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <p className="mb-12 font-mono text-[9px] tracking-[0.25em] text-white/30">
          {"// what i do"}
        </p>

        <div className="border-t border-[rgba(255,255,255,0.06)]">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
              className="group mb-8 border-b border-[rgba(255,255,255,0.06)] py-8"
            >
              <span className="block font-mono text-[11px] text-white/20">
                0{i + 1}
              </span>

              <div className="mt-2 flex items-start justify-between gap-4">
                <h3 className="font-display text-[clamp(36px,5vw,72px)] font-bold leading-[1.05] tracking-[-0.02em] text-white transition-colors duration-300 ease-out group-hover:text-accent">
                  {service.title}
                </h3>
                <span className="mt-2 shrink-0 font-body text-[20px] text-white/30 transition-transform duration-300 ease-out group-hover:translate-x-1.5">
                  →
                </span>
              </div>

              <p className="mt-2 font-mono text-[11px] text-white/35">
                {service.subItems}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
