export const COLORS = {
  // Matches the new HTML-side --bg / tailwind "background" token (#080808)
  // so the fixed 3D canvas doesn't show a visible seam against the page.
  // accent/white/secondary intentionally left as-is: the truck→laptop
  // cinematic scene and dashboard weren't part of the gold-accent redesign.
  background: "#080808",
  accent: "#FF2A2A",
  white: "#F5F5F0",
  secondary: "#1A1A1E",
} as const;

export const NAV_LINKS = [
  { label: "Work", href: "#projects" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#cta" },
] as const;

export const SITE = {
  name: "Amanrao",
  role: "Full Stack Developer & Data Analyst",
  tagline: "From engineering trucks to engineering software.",
} as const;

export const CONTACT = {
  email: "amanrao8871@gmail.com",
  whatsapp: "https://wa.me/917470543660",
  github: "https://github.com/amalrao",
  linkedin: "https://www.linkedin.com/in/aman-rao-125b2319b/",
} as const;

export const SERVICES = [
  {
    title: "web development",
    subItems: "React · Next.js · FastAPI",
  },
  {
    title: "data & analytics",
    subItems: "Power BI · Python · PostgreSQL",
  },
  {
    title: "full-stack products",
    subItems: "End-to-end · API · Deploy",
  },
] as const;

export const SCROLL_SECTIONS = [
  "hero",
  "about",
  "services",
  "projects",
  "testimonial",
  "cta",
] as const;

/**
 * Scroll-progress boundaries between the three canvas scenes: hero globe,
 * truck→laptop vehicle handoff, and the data dashboard. Each 3D component
 * reads these to decide when it should be visible.
 */
export const SCENE_TRANSITIONS = {
  globeEnd: 0.2,
  // Was 0.65 — that put the HTML-content reveal threshold (see
  // useScrollThreshold(vehicleEnd) in Services/About/Projects/Testimonial/
  // CTA) so far past where those sections actually sit in the (now much
  // shorter) document that Services and About could never reach full
  // opacity during a normal scroll — they'd already be scrolled off-screen
  // above the reveal point. 0.45 keeps the cinematic's phase *shape*
  // identical (phases still interpolate 0→1 within their span, see
  // lib/truckLaptopPhases.ts) while compressing how much total scroll it
  // needs, which also realigns this threshold with the shorter page.
  vehicleEnd: 0.45,
  // The laptop (components/canvas/Laptop.tsx) doesn't disappear the instant
  // scrollProgress crosses vehicleEnd — it fades out over its own
  // EXIT_FADE_WIDTH for the dashboard handoff. Gating Services/About/
  // Projects/Testimonial on vehicleEnd directly made their text fade in
  // while the laptop was still visibly fading out underneath it. Gating on
  // contentReveal instead waits until that exit fade has actually
  // finished. Must track vehicleEnd + Laptop.tsx's EXIT_FADE_WIDTH exactly
  // — too wide a gap here and Services' own text has already scrolled out
  // of view by the time it's allowed to appear (screenshot-verified: at
  // +0.1 Services was effectively unreachable on this page's layout).
  contentReveal: 0.48,
} as const;
