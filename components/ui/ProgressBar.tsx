"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useSiteStore } from "@/lib/store";

export default function ProgressBar() {
  const scrollProgress = useSiteStore((state) => state.scrollProgress);
  const progress = useSpring(0, { stiffness: 120, damping: 20, mass: 0.2 });

  useEffect(() => {
    progress.set(scrollProgress);
  }, [scrollProgress, progress]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-secondary/40">
      <motion.div
        className="h-full origin-left bg-accent"
        style={{ scaleX: progress }}
      />
    </div>
  );
}
