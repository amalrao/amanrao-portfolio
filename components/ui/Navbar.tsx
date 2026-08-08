"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CONTACT, NAV_LINKS, SITE } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

export default function Navbar() {
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);
  const isMenuOpen = useSiteStore((state) => state.isMenuOpen);
  const toggleMenu = useSiteStore((state) => state.toggleMenu);
  const setMenuOpen = useSiteStore((state) => state.setMenuOpen);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed left-0 right-0 top-0 z-[100] grid h-[72px] grid-cols-[1fr_auto_1fr] items-center bg-transparent px-6 transition-[border-color] duration-300 ease-in-out md:px-12"
        style={{
          borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.06)" : "transparent"}`,
        }}
      >
        <a
          href="#hero"
          className="justify-self-start font-sans text-base font-medium tracking-[0.2em] text-white transition-colors duration-200 hover:text-accent"
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
        >
          {SITE.name.toLowerCase()}
        </a>

        <nav className="col-start-2 hidden items-center gap-9 justify-self-center md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-white"
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Doubles as the WhatsApp entry point — the old "Let's Talk" button
            was removed per spec, and CTA's WhatsApp button moved here since
            the navbar layout has no other slot described for it. */}
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 justify-self-end md:flex"
          onMouseEnter={() => setCursorVariant("hover")}
          onMouseLeave={() => setCursorVariant("default")}
        >
          <span className="relative flex h-[6px] w-[6px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00FF85] opacity-75" />
            <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[#00FF85]" />
          </span>
          <span className="font-mono text-[9px] tracking-[0.15em] text-white/45">
            open to work
          </span>
        </a>

        <button
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={toggleMenu}
          className="relative z-[110] col-start-3 flex h-6 w-6 flex-col items-center justify-center justify-self-end gap-[5px] md:hidden"
        >
          <span
            className="block h-[2px] w-6 bg-white transition-transform duration-200"
            style={
              isMenuOpen
                ? { transform: "translateY(7px) rotate(45deg)" }
                : undefined
            }
          />
          <span
            className="block h-[2px] w-6 bg-white transition-opacity duration-200"
            style={isMenuOpen ? { opacity: 0 } : undefined}
          />
          <span
            className="block h-[2px] w-6 bg-white transition-transform duration-200"
            style={
              isMenuOpen
                ? { transform: "translateY(-7px) rotate(-45deg)" }
                : undefined
            }
          />
        </button>
      </motion.header>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[105] flex flex-col items-center justify-center gap-6 bg-background px-6 py-12"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className="font-display text-[48px] font-bold leading-none text-white"
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
