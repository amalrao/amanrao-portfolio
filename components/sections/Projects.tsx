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
  image: string;
}

const PROJECTS: Project[] = [
  {
    title: "Real-Time CCTV Monitoring Platform",
    description: "Dashboard for tracking CCTV equipment installation and completion across warehouses and regions, with AI-assisted certificate extraction and reporting.",
    tag: "PYTHON",
    year: "2024",
    image: "/projects/cctv.png.png",
  },
  {
    title: "HRMS & Attendance Management System",
    description: "Full HRMS integrating biometric attendance with payroll, leave, performance management, and an employee self-service portal.",
    tag: "REACT",
    year: "2024",
    image: "/projects/hrms.png.jpg",
  },
  {
    title: "E-PCB Industry Platform",
    description: "Marketing website for a PCB manufacturer, featuring product types, manufacturing processes, industries served, and a functional contact system.",
    tag: "REACT",
    year: "2024",
    image: "/projects/epcb.png.jpg",
  },
  {
    title: "Boutique Management System",
    description: "Tailoring shop management system for customer measurements, order and payment tracking, worker assignment, and analytics.",
    tag: "FASTAPI",
    year: "2024",
    image: "/projects/boutique.png.png",
  },
  {
    title: "Aman Events — Event Management Platform",
    description: "Event management website featuring services, pricing, testimonials, portfolio galleries, FAQs, and Instagram integration.",
    tag: "HTML",
    year: "2023",
    image: "/projects/aman-events.png.jpg",
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
        className="bg-background"
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
              className="group grid grid-cols-[24px_1fr_auto] items-center gap-3 border-b border-l-2 border-[rgba(255,255,255,0.06)] border-l-transparent px-1 py-4 transition-[background-color,border-color] duration-[250ms] ease-out hover:border-l-accent hover:bg-[rgba(255,255,255,0.02)] sm:grid-cols-[40px_1fr_auto_40px] sm:gap-4 sm:px-2 sm:py-6"
            >
              <span className="font-mono text-xs text-white/20">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="flex min-w-0 items-center gap-3 transition-transform duration-[250ms] ease-out group-hover:translate-x-1">
                <div className="h-14 w-[93px] shrink-0 overflow-hidden rounded-md ring-1 ring-white/10 sm:h-[90px] sm:w-[150px]">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-105 group-hover:brightness-110"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-bold text-white sm:text-[22px]">
                    {project.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 font-body text-[13px] text-white/40">
                    {project.description}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-accent">
                  {project.tag}
                </span>
                <span className="mt-1 block font-mono text-[10px] text-white/25">
                  {project.year}
                </span>
              </div>

              <span className="hidden h-8 w-8 items-center justify-center justify-self-end rounded-full border border-white/15 font-mono text-base text-white/25 transition-[transform,color,background-color,border-color] duration-[250ms] ease-out group-hover:translate-x-1 group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent sm:flex">
                →
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
