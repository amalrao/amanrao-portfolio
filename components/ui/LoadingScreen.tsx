"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";

/** Fullscreen overlay shown while the 3D scene's assets are loading. */
export default function LoadingScreen() {
  const { progress } = useProgress();

  // This scene builds its geometry procedurally and draws its textures
  // straight onto a CanvasTexture — neither goes through THREE's loading
  // manager, so `progress` never advances for a load-free page. Treat the
  // progress-bar's own 2s fill as the ground truth and let useProgress
  // short-circuit it only if there ever is real, trackable loading work.
  const [timeElapsed, setTimeElapsed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimeElapsed(true), 2000);
    return () => clearTimeout(id);
  }, []);

  const isLoading = progress < 100 && !timeElapsed;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ backgroundColor: "#0D1117" }}
        >
          <span
            className="font-display font-bold"
            style={{ fontSize: 32, letterSpacing: "0.2em", color: "#E6EDF3" }}
          >
            amanrao
          </span>

          <div
            className="mt-6 overflow-hidden"
            style={{
              width: 200,
              height: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
              style={{ height: "100%", backgroundColor: "#00FF85" }}
            />
          </div>

          <span
            className="mt-4 font-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              color: "rgba(139,148,158,0.7)",
            }}
          >
            LOADING EXPERIENCE
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
