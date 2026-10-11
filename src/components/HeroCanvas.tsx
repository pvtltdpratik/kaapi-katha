"use client";

import { useRef, useSyncExternalStore } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cupInput, cupMode } from "@/lib/cupStore";

/** Still illustration, only shown when WebGL is unavailable. */
function StaticCup() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 360 300"
        className="w-[min(60vw,420px)] h-auto rotate-[-12deg] translate-x-[12%]"
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
 * Layering, back to front:
 *   red ground  ->  headline (z-10)  ->  page-wide WebGL cup (z-20)
 *   ->  drag surface (z-25)  ->  supporting copy and buttons (z-30)
 * The cup overlaps the headline on purpose; the things you press never sit under it.
 */
export default function HeroCanvas() {
  const ref = useRef<HTMLElement>(null);
  const mode = useSyncExternalStore(cupMode.subscribe, cupMode.get, () => "pending" as const);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const copyOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

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

  return (
    <section
      id="home"
      ref={ref}
      className="theme-red bg-ground text-fg relative min-h-[100svh] overflow-hidden"
    >
      {mode === "fallback" && <StaticCup />}

      {/* headline: centred, and the thing the cup sits in front of */}
      <div className="relative z-10 min-h-[100svh] flex items-center justify-center text-center px-5 pt-24 pb-52 md:pb-44">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="display text-fg text-[clamp(3rem,10vw,9.5rem)] max-w-[13ch]"
        >
          A little more India in every pour.
        </motion.h1>
      </div>

      {/* drag / hover surface for the cup (the canvas itself is click-through) */}
      <div
        className="absolute z-[25] right-0 top-24 bottom-40 w-[72%] md:w-[58%] cursor-grab active:cursor-grabbing"
        style={{ touchAction: "pan-y" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onPointerEnter={() => (cupInput.hover = true)}
        onPointerLeave={() => (cupInput.hover = false)}
        aria-hidden
      />

      {/* supporting copy and actions, above the cup so they are never covered */}
      <motion.div
        style={{ opacity: copyOpacity }}
        className="absolute z-30 inset-x-0 bottom-0 px-5 pb-28 md:pb-12 flex flex-col items-center text-center gap-4"
      >
        <p className="text-accent text-lg" style={{ fontFamily: "var(--font-deva)" }}>
          हर घूंट में थोड़ा और भारत
        </p>
        <p className="text-fg/80 text-base md:text-lg max-w-md leading-relaxed">
          Filter coffee the slow way: a strong decoction, hot milk, and a long pour between two cups.
        </p>
        <div className="flex items-center gap-7 flex-wrap justify-center mt-1">
          <a href="#menu" className="btn">
            See the menu
          </a>
          <a href="#customizer" className="link">
            Build your cup
          </a>
        </div>
      </motion.div>
    </section>
  );
}
