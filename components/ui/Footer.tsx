"use client";

import { CONTACT, SITE } from "@/lib/constants";
import { useSiteStore } from "@/lib/store";

const SOCIALS = [
  { label: "GITHUB", href: CONTACT.github },
  { label: "LINKEDIN", href: CONTACT.linkedin },
  { label: "EMAIL", href: `mailto:${CONTACT.email}` },
];

export default function Footer() {
  const setCursorVariant = useSiteStore((state) => state.setCursorVariant);

  return (
    <footer className="grid grid-cols-1 items-center gap-4 border-t border-[rgba(255,255,255,0.06)] px-6 py-8 text-center md:grid-cols-3 md:px-20 md:text-left">
      <span className="font-mono text-[11px] text-white/25 md:justify-self-start">
        {SITE.name.toUpperCase()}
      </span>

      <span className="font-mono text-[9px] tracking-[0.1em] text-white/20 md:justify-self-center">
        built by amanrao · 2025
      </span>

      <div className="flex items-center justify-center gap-2 md:justify-self-end">
        {SOCIALS.map((social, i) => (
          <span key={social.label} className="flex items-center gap-2">
            {i > 0 && <span className="text-[10px] text-white/25">·</span>}
            <a
              href={social.href}
              target={social.href.startsWith("http") ? "_blank" : undefined}
              rel={
                social.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              onMouseEnter={() => setCursorVariant("hover")}
              onMouseLeave={() => setCursorVariant("default")}
              className="font-mono text-[10px] uppercase text-white/25 transition-colors hover:text-white"
            >
              {social.label}
            </a>
          </span>
        ))}
      </div>
    </footer>
  );
}
