"use client";

import { motion } from "framer-motion";
import { SCENE_TRANSITIONS } from "@/lib/constants";
import { useScrollThreshold } from "@/hooks/useScrollThreshold";

/**
 * Hidden until the truck→laptop cinematic finishes (scrollProgress ≥
 * contentReveal, i.e. past the laptop's own exit fade), same as the sections around it. Stays on the site's dark
 * theme — the earlier light-bleed break from it is gone.
 */
export default function Testimonial() {
  const visible = useScrollThreshold(SCENE_TRANSITIONS.contentReveal);

  return (
    <section id="testimonial" className="section-content overflow-hidden">
      <motion.div
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ pointerEvents: visible ? "auto" : "none" }}
        className="flex min-h-[50vh] w-full items-center justify-center bg-background px-6 pb-32 pt-[80px] md:px-12"
      >
        <motion.blockquote
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="mx-auto max-w-[720px] text-center"
        >
          <span className="block font-display text-[96px] leading-[0.5] text-accent">
            &ldquo;
          </span>

          <p className="mt-8 font-display text-[clamp(22px,3vw,40px)] font-bold leading-[1.15] text-white">
            Amanrao built our entire platform in record time. Clean code,
            fast delivery, zero hand-holding.
          </p>

          <div className="mx-auto my-8 h-px w-[40px] bg-accent" />

          <footer>
            <p className="font-mono text-[11px] tracking-[0.15em] text-accent">
              rahul sharma
            </p>
            <p className="mt-1 font-body text-[12px] text-white/40">
              Founder, TechStartup India
            </p>
          </footer>
        </motion.blockquote>
      </motion.div>
    </section>
  );
}
