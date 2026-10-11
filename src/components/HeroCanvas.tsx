"use client";

import { useRef, useSyncExternalStore } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cupMode } from "@/lib/cupStore";

/** Still illustration, only shown when WebGL is unavailable. */
function StaticCup() {
  return (
    <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 flex items-center justify-center pointer-events-none">
      <svg
        viewBox="0 0 360 300"
        className="w-[min(60vw,380px)] h-auto rotate-[-12deg]"
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
        <path
          d="M268 100 C340 90 350 190 270 200"
          fill="none"
          stroke="url(#ceramic)"
          strokeWidth="20"
          strokeLinecap="round"
        />
        <path d="M60 70 H270 C270 190 240 250 165 250 C90 250 60 190 60 70 Z" fill="url(#ceramic)" />
        <ellipse cx="165" cy="70" rx="105" ry="22" fill="#efe8da" />
        <ellipse cx="165" cy="74" rx="90" ry="16" fill="#6b4425" />
      </svg>
    </div>
  );
}

export default function HeroCanvas() {
  const ref = useRef<HTMLElement>(null);
  const reduced = !!useReducedMotion();
  const mode = useSyncExternalStore(cupMode.subscribe, cupMode.get, () => "pending" as const);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // headline leaves as the cup moves on
  const textY = useTransform(scrollYProgress, [0, 0.7], [0, reduced ? 0 : -80]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-end lg:items-center overflow-hidden"
    >
      {/* soft light behind the cup lane */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 45% 65% at 75% 50%, rgba(212,148,58,0.18), transparent 70%)",
        }}
      />

      {mode === "fallback" && <StaticCup />}

      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="relative z-10 w-full px-6 md:px-12 lg:px-20 pt-28 pb-14 lg:pb-24 lg:max-w-[min(50%,40rem)]"
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="text-[#E3AE62] text-[0.65rem] md:text-xs uppercase mb-5"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }}
        >
          Kaapi Katha — filter coffee, reimagined
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-[2.6rem] sm:text-5xl lg:text-6xl xl:text-7xl text-[#F3E8D4] font-medium leading-[1.04] mb-5"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
        >
          A little more <span className="italic text-[#E3AE62]">India</span> in
          every pour.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="text-[#D4943A] text-base md:text-lg mb-6"
          style={{ fontFamily: "var(--font-deva)" }}
        >
          हर घूंट में थोड़ा और भारत
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="hidden sm:block text-white/60 text-sm md:text-base leading-relaxed mb-9 max-w-md"
        >
          Decoction dripped slow, milk steamed soft, and a cup that still feels
          right in your hands. Old rituals, poured for today.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-4 flex-wrap"
        >
          <a href="#menu" className="btn-cta">
            Explore the menu
          </a>
          <a href="#story" className="btn-outline">
            Read the story
          </a>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-8 left-6 md:left-12 lg:left-20 hidden md:flex items-center gap-3 pointer-events-none">
        <span className="block w-10 h-[1px] bg-[#D4943A]/60" />
        <span
          className="text-white/30 text-[0.6rem] uppercase"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.25em" }}
        >
          Scroll — follow the cup
        </span>
      </div>
    </section>
  );
}
