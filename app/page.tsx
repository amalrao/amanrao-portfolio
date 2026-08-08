"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import Navbar from "@/components/ui/Navbar";
import CustomCursor from "@/components/ui/CustomCursor";
import ProgressBar from "@/components/ui/ProgressBar";
import LoadingScreen from "@/components/ui/LoadingScreen";
import Footer from "@/components/ui/Footer";
import Hero from "@/components/sections/Hero";
import TruckLaptopOverlay from "@/components/sections/TruckLaptopOverlay";
import About from "@/components/sections/About";
import Experience from "@/components/sections/Experience";
import Services from "@/components/sections/Services";
import Projects from "@/components/sections/Projects";
import Testimonial from "@/components/sections/Testimonial";
import CTA from "@/components/sections/CTA";

// The R3F canvas touches window/WebGL — keep it client-only.
const Scene = dynamic(() => import("@/components/canvas/Scene"), {
  ssr: false,
});

export default function Home() {
  useScrollProgress();

  return (
    <>
      <ProgressBar />
      <CustomCursor />
      <Navbar />

      <LoadingScreen />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
      <TruckLaptopOverlay />

      <main className="relative z-10">
        <Hero />
        {/* Scroll room for the truck→laptop cinematic (scrollProgress 0.20–0.45).
            No HTML section lives here — the 3D scene and its own text
            overlay are the only content for this stretch. Sized so that
            vehicleEnd's scroll fraction lands at/before where the Services
            section physically starts — too small here and Services/About
            become unreachable (they scroll past while still hidden by the
            SCENE_TRANSITIONS.vehicleEnd gate); too large and it's dead
            scroll distance for no reason. This is a case-by-case balance
            against the content sections' heights, not a fixed constant —
            re-check both if either side changes substantially. */}
        <div aria-hidden className="h-[150vh]" />
        <Services />
        <About />
        <Experience />
        <Projects />
        <Testimonial />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
