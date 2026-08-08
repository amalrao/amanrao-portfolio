"use client";

import { motion, type Variants } from "framer-motion";
import { useSiteStore } from "@/lib/store";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: EASE },
});

const headlineContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const headlineLine: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const HEADLINE_LINES = ["i build things", "that work."];

export default function Hero() {
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);

  return (
    <section
      id="hero"
      className="section-content pointer-events-none flex min-h-[80vh] w-full flex-col justify-center overflow-x-hidden pb-[60px] pt-[100px]"
    >
      <div className="flex max-w-[600px] flex-col gap-5 px-6 md:px-12">
        <motion.h1
          initial="hidden"
          animate="show"
          variants={headlineContainer}
          className="font-display font-semibold text-[clamp(72px,9vw,128px)] leading-[0.92] text-white"
        >
          {HEADLINE_LINES.map((line) => (
            <motion.span
              key={line}
              variants={headlineLine}
              className="block whitespace-nowrap"
            >
              {line}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          {...fadeUp(0.7)}
          className="max-w-[420px] font-mono text-[14px] leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          <span className="block">full stack developer &amp; data engineer.</span>
          <span className="block">noida, india.</span>
          <span className="block">ex-automobile engineer — yes, really.</span>
        </motion.p>

        <motion.a
          {...fadeUp(1)}
          href="#projects"
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
          className="pointer-events-auto inline-block w-fit font-mono text-[12px] transition-colors hover:text-white"
          style={{ color: "var(--muted)" }}
        >
          scroll to see my work ↓
        </motion.a>
      </div>
    </section>
  );
}
