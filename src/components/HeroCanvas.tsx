"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { cupInput, cupMode } from "@/lib/cupStore";
import { gsap, whenMotionAllowed } from "@/lib/gsap";

/** Still illustration, only shown when WebGL is unavailable. */
function StaticCup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 360 300"
        className="w-[min(60vw,420px)] h-auto rotate-[-12deg]"
        role="img"
        aria-label="A ceramic coffee cup, tilted to the right"
      >
        <defs>
          <linearGradient id="ceramic" x1="0" x2="1">
            <stop offset="0" stopColor="#cfc7b8" />
            <stop offset="0.4" stopColor="#fbf7ef" />
            <stop offset="1" stopColor="#bdb4a4" />
          </linearGradient>
        </defs>
        <path d="M268 100 C340 90 350 190 270 200" fill="none" stroke="url(#ceramic)" strokeWidth="20" strokeLinecap="round" />
        <path d="M60 70 H270 C270 190 240 250 165 250 C90 250 60 190 60 70 Z" fill="url(#ceramic)" />
        <ellipse cx="165" cy="70" rx="105" ry="22" fill="#efe8da" />
        <ellipse cx="165" cy="74" rx="90" ry="16" fill="#6b4425" />
      </svg>
    </div>
  );
}

/*
 * Editorial hero. The brand name is set very large on either side of the cup,
 * which is the centre of the composition and overlaps the inner edges of both
 * words. The tagline and actions sit below, above the cup in the stacking
 * order, so nothing you press is ever under it.
 *
 * Back to front:
 *   red ground -> wordmark (z-10) -> page-wide WebGL cup (z-20)
 *   -> drag surface (z-25) -> tagline and actions (z-30)
 */
export default function HeroCanvas() {
  const ref = useRef<HTMLElement>(null);
  const mode = useSyncExternalStore(cupMode.subscribe, cupMode.get, () => "pending" as const);

  // entrance once, then the composition opens up as you scroll away
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    return whenMotionAllowed(() => {
      const left = root.querySelector<HTMLElement>("[data-side='l']");
      const right = root.querySelector<HTMLElement>("[data-side='r']");
      const copy = root.querySelector<HTMLElement>("[data-hero-copy]");
      const ins = root.querySelectorAll<HTMLElement>("[data-in]");

      const intro = gsap.from(ins, { yPercent: 40, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.15 });
      // entrance on the inner wrapper, scroll scrub on the outer one: they never fight
      const copyInner = root.querySelector<HTMLElement>("[data-copy-in]");
      const copyIn = gsap.from(copyInner, { opacity: 0, y: 24, duration: 0.9, ease: "power3.out", delay: 0.7 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
      });
      tl.to(left, { xPercent: -22, opacity: 0, ease: "none" }, 0)
        .to(right, { xPercent: 22, opacity: 0, ease: "none" }, 0)
        .to(copy, { y: -40, opacity: 0, ease: "none" }, 0);

      return () => {
        intro.kill();
        copyIn.kill();
        tl.scrollTrigger?.kill();
        tl.kill();
        gsap.set([left, right, copy, copyInner, ...ins].filter(Boolean) as HTMLElement[], { clearProps: "all" });
      };
    });
  }, []);

  const drag = useRef({ x: 0, id: -1 });
  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, id: e.pointerId };
    cupInput.dragging = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cupInput.dragging || drag.current.id !== e.pointerId) return;
    const dx = e.clientX - drag.current.x;
    drag.current.x = e.clientX;
    cupInput.yaw = Math.min(1.1, Math.max(-1.1, cupInput.yaw + dx * 0.012));
  };
  const onUp = () => {
    cupInput.dragging = false;
  };

  const word =
    "display text-fg leading-[0.9] text-[clamp(4rem,21vw,6.5rem)] md:text-[clamp(4rem,11.5vw,11.5rem)]";

  return (
    <section
      id="home"
      ref={ref}
      className="theme-red bg-ground text-fg relative min-h-[100svh] overflow-hidden"
    >
      {mode === "fallback" && <StaticCup />}

      {/* wordmark: the cup sits between, and over the inner edges of, the two words */}
      <div className="relative z-10 min-h-[100svh] flex items-center justify-center px-4 pt-10 pb-52 md:pb-44">
        <h1 className="flex flex-col md:flex-row items-center gap-[38vw] md:gap-[22vw]">
          <span data-side="l" className="block overflow-hidden">
            <span data-in className={`block ${word}`}>
              Kaapi
            </span>
          </span>
          <span className="sr-only"> </span>
          <span data-side="r" className="block overflow-hidden">
            <span data-in className={`block ${word}`}>
              Katha
            </span>
          </span>
        </h1>
      </div>

      {/* drag / hover surface for the cup (the canvas itself is click-through) */}
      <div
        className="absolute z-[25] left-1/2 -translate-x-1/2 top-20 bottom-48 w-[62%] md:w-[34%] cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={() => (cupInput.hover = true)}
        onPointerLeave={() => (cupInput.hover = false)}
        aria-hidden
      />

      {/* tagline and actions: above the cup, never covered */}
      <div
        data-hero-copy
        className="absolute z-30 inset-x-0 bottom-0 px-5 pb-28 md:pb-12 flex flex-col items-center text-center gap-3"
      >
        <div data-copy-in className="flex flex-col items-center gap-3">
          <p className="display text-fg text-[clamp(1.35rem,3vw,2.1rem)]">A little more India in every pour.</p>
          <p className="text-accent text-base" style={{ fontFamily: "var(--font-deva)" }}>
            हर घूंट में थोड़ा और भारत
          </p>
          <div className="flex items-center gap-7 flex-wrap justify-center mt-2">
            <a href="#menu" className="btn">
              See the menu
            </a>
            <a href="#customizer" className="link">
              Build your cup
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
