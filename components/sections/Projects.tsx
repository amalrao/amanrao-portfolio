"use client";

import { motion } from "framer-motion";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";
import { useSiteStore } from "@/lib/store";

interface Project {
  title: string;
  description: string;
  tag: string;
  year: string;
}

const PROJECTS: Project[] = [
  {
    title: "railtel-cctv-dashboard",
    description: "Real-time CCTV monitoring dashboard with automated reports",
    tag: "PYTHON",
    year: "2024",
  },
  {
    title: "hr-attendance-system",
    description: "Biometric attendance system with live tracking",
    tag: "REACT",
    year: "2024",
  },
  {
    title: "e-pcb-industry",
    description: "Modern company website with animations and contact form",
    tag: "REACT",
    year: "2024",
  },
  {
    title: "boutique-management-system",
    description: "Full tailoring management app — orders, billing",
    tag: "FASTAPI",
    year: "2024",
  },
  {
    title: "aman-events",
    description: "Luxury event management website with premium aesthetic",
    tag: "HTML",
    year: "2023",
  },
  {
    title: "raj-tailors",
    description: "Local business website with WhatsApp-first CTAs",
    tag: "HTML",
    year: "2023",
  },
];

/** Hidden until the truck→laptop cinematic scene, including the laptop's own exit fade, finishes (scrollProgress ≥ contentReveal). */
export default function Projects() {
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);
  const visible = useScrollThreshold(SCENE_TRANSITIONS.contentReveal);

  return (
    <section
      id="projects"
      className="section-content min-h-[70vh] overflow-hidden px-6 py-8 md:px-12"
    >
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        <div className="flex items-baseline justify-between border-b border-[rgba(255,255,255,0.06)] pb-4">
          <span className="font-mono text-[9px] tracking-[0.25em] text-white/30">
            projects
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
            {String(PROJECTS.length).padStart(2, "0")}
          </span>
        </div>

        <div>
          {PROJECTS.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
              className="group grid grid-cols-[40px_1fr_auto_40px] items-center gap-4 border-b border-l-2 border-[rgba(255,255,255,0.06)] border-l-transparent px-2 py-6 transition-[background-color,border-color] duration-[250ms] ease-out hover:border-l-accent hover:bg-[rgba(255,255,255,0.02)]"
            >
              <span className="font-mono text-xs text-white/20">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 transition-transform duration-[250ms] ease-out group-hover:translate-x-1">
                <h3 className="font-display text-[22px] font-bold text-white">
                  {project.title}
                </h3>
                <p className="mt-1 line-clamp-1 font-body text-[13px] text-white/40">
                  {project.description}
                </p>
              </div>

              <div className="text-right">
                <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
                  {project.tag}
                </span>
                <span className="mt-1 block font-mono text-[10px] text-white/25">
                  {project.year}
                </span>
              </div>

              <span className="justify-self-end font-mono text-base text-white/25 transition-transform duration-[250ms] ease-out group-hover:translate-x-1">
                →
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
