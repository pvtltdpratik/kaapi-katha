import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register once, on the client only.
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/** Run `fn` only when the user has not asked for reduced motion; returns cleanup. */
export function whenMotionAllowed(fn: () => void | (() => void)) {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => fn());
  return () => mm.revert();
}
