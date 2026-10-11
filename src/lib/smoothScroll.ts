import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

/*
 * Lenis drives smooth scrolling; GSAP's ticker drives Lenis, and Lenis tells
 * ScrollTrigger when it moved. One clock, so scrubbed animations and the cup's
 * own scroll-keyframes never disagree by a frame.
 *
 * Reduced motion: no Lenis at all, the browser's native scrolling is used.
 */

let instance: Lenis | null = null;

export function getLenis() {
  return instance;
}

export function initSmoothScroll(): () => void {
  if (typeof window === "undefined") return () => undefined;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => undefined;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
    // touch keeps the device's own momentum, which is what people expect
    syncTouch: false,
  });
  instance = lenis;

  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    lenis.destroy();
    instance = null;
  };
}

/** Smooth-scroll to a #hash if Lenis is running; returns false to let the browser do it. */
export function scrollToHash(hash: string, duration = 1.1): boolean {
  const lenis = instance;
  if (!lenis || !hash.startsWith("#")) return false;
  const el = document.getElementById(hash.slice(1));
  if (!el) return false;
  lenis.scrollTo(el, { duration, offset: 0 });
  history.replaceState(null, "", hash);
  return true;
}
