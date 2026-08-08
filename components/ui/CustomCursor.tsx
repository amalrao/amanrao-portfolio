"use client";

import { useEffect, useRef } from "react";
import { useSiteStore } from "@/lib/store";

function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

/**
 * Two-part custom cursor: a dot that tracks the mouse exactly, and a ring
 * that trails behind it via a hand-rolled requestAnimationFrame + lerp loop
 * (kept out of React state so neither element causes a re-render per move).
 */
export default function CustomCursor() {
  const cursorVariant = useSiteStore((state) => state.cursorVariant);
  const isHover = cursorVariant !== "default";

  const dotOuterRef = useRef<HTMLDivElement>(null);
  const ringOuterRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotOuterRef.current) {
        dotOuterRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    window.addEventListener("mousemove", handleMove);

    const tick = () => {
      ringPos.current.x = lerp(ringPos.current.x, target.current.x, 0.1);
      ringPos.current.y = lerp(ringPos.current.y, target.current.y, 0.1);
      if (ringOuterRef.current) {
        ringOuterRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafId.current !== undefined) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <>
      <div
        ref={dotOuterRef}
        className="cursor-follower pointer-events-none fixed left-0 top-0 z-[110] hidden md:block"
      >
        <div
          className="rounded-full bg-accent transition-transform duration-200 ease-out"
          style={{
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            transform: isHover ? "scale(0)" : "scale(1)",
          }}
        />
      </div>
      <div
        ref={ringOuterRef}
        className="cursor-follower pointer-events-none fixed left-0 top-0 z-[110] hidden md:block"
      >
        <div
          className="rounded-full transition-[transform,border-color] duration-200 ease-out"
          style={{
            width: 32,
            height: 32,
            marginLeft: -16,
            marginTop: -16,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: isHover ? "#00FF85" : "rgba(0,255,133,0.3)",
            transform: isHover ? "scale(2.5)" : "scale(1)",
          }}
        />
      </div>
    </>
  );
}
