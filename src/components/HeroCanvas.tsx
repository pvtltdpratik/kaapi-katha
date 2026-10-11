"use client";

import { useRef, useSyncExternalStore } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
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
        <path d="M268 100 C340 90 350 190 270 200" fill="none" stroke="url(#ceramic)" strokeWidth="20" strokeLinecap="round" />
        <path d="M60 70 H270 C270 190 240 250 165 250 C90 250 60 190 60 70 Z" fill="url(#ceramic)" />
        <ellipse cx="165" cy="70" rx="105" ry="22" fill="#efe8da" />
        <ellipse cx="165" cy="74" rx="90" ry="16" fill="#6b4425" />
      </svg>
    </div>
  );
}

export default function HeroCanvas() {
  const ref = useRef<HTMLElement>(null);
  const mode = useSyncExternalStore(cupMode.subscribe, cupMode.get, () => "pending" as const);

  // the headline leaves as the cup moves on; that is the only scroll effect here
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative min-h-screen flex items-end lg:items-center overflow-hidden"
    >
      {mode === "fallback" && <StaticCup />}

      {/* the text block is centred in the space left of the cup lane */}
      <div className="relative z-10 w-full lg:w-[58%] lg:flex lg:justify-center">
        <motion.div
          style={{ opacity: textOpacity }}
          className="w-full px-6 md:px-12 lg:px-0 pt-28 pb-14 lg:pb-24 lg:max-w-[34rem]"
        >
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="display text-[2.7rem] sm:text-6xl lg:text-[3.4rem] xl:text-[4.5rem] text-[#efe6d6] mb-6"
          >
            A little more India in every pour.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-[#d19a4f] text-lg mb-5"
            style={{ fontFamily: "var(--font-deva)" }}
          >
            हर घूंट में थोड़ा और भारत
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="hidden sm:block text-[#efe6d6]/65 text-base leading-relaxed mb-9 max-w-sm"
          >
            Filter coffee the slow way: a strong decoction, hot milk, and a long pour between two cups.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex items-center gap-7 flex-wrap"
          >
            <a href="#menu" className="btn">
              See the menu
            </a>
            <a href="#story" className="link">
              Our story
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
