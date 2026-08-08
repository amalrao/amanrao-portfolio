"use client";

import { motion } from "framer-motion";
import { CONTACT } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.5 },
  transition: { duration: 0.7, delay, ease: EASE },
});

export default function CTA() {
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);

  return (
    <section
      id="cta"
      className="section-content flex min-h-[60vh] flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center md:px-12"
    >
      <motion.h2
        {...fadeUp(0)}
        className="font-display text-[clamp(64px,8vw,120px)] font-bold leading-[0.9] text-white"
      >
        want to work together?
      </motion.h2>

      <motion.div
        {...fadeUp(0.3)}
        className="mt-12 flex flex-wrap items-center justify-center gap-4"
      >
        <motion.a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.03 }}
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
          className="rounded-none border border-white/25 bg-transparent px-12 py-[18px] font-mono text-xs uppercase tracking-[0.15em] text-white transition-colors duration-300 hover:bg-white hover:text-background"
        >
          Start a project →
        </motion.a>
      </motion.div>

      <motion.div {...fadeUp(0.45)} className="mt-20">
        <a
          href={`mailto:${CONTACT.email}`}
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
          className="mt-2 inline-block font-mono text-[11px] text-accent hover:underline"
        >
          {CONTACT.email}
        </a>
      </motion.div>
    </section>
  );
}
