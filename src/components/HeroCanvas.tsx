"use client";

import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

const hotspots = [
  {
    title: "The steel tumbler",
    text: "Rolled rim, thin wall, built to be held and handed over. Hot kaapi, cool fingers.",
  },
  {
    title: "Frothy decoction",
    text: "Strong decoction, hot milk, and a long pour between tumbler and davara until it froths.",
  },
  {
    title: "The brass davara",
    text: "A wide bowl that catches the drips and cools each pour before the first sip.",
  },
];

function detectWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const MOBILE_QUERY = "(max-width: 767px)";

function useIsMobile() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}

class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Still illustration shown when WebGL is unavailable or fails. */
function StaticTumbler() {
  return (
    <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[12vw]">
      <svg
        viewBox="0 0 320 380"
        className="w-[min(70vw,380px)] h-auto"
        role="img"
        aria-label="A steel tumbler resting in a brass davara"
      >
        <defs>
          <linearGradient id="steel" x1="0" x2="1">
            <stop offset="0" stopColor="#8e949b" />
            <stop offset="0.35" stopColor="#f0f2f4" />
            <stop offset="0.7" stopColor="#a4aab1" />
            <stop offset="1" stopColor="#6d737a" />
          </linearGradient>
          <linearGradient id="brass" x1="0" x2="1">
            <stop offset="0" stopColor="#8a6424" />
            <stop offset="0.5" stopColor="#e1b45e" />
            <stop offset="1" stopColor="#7a5519" />
          </linearGradient>
        </defs>
        <ellipse cx="160" cy="340" rx="140" ry="18" fill="#000" opacity="0.4" />
        <path d="M30 290 Q160 372 290 290 L270 270 H50 Z" fill="url(#brass)" />
        <ellipse cx="160" cy="270" rx="110" ry="22" fill="#5b4016" />
        <path d="M95 60 L225 60 L212 300 H108 Z" fill="url(#steel)" />
        <ellipse cx="160" cy="60" rx="65" ry="12" fill="#c7cbd0" />
        <ellipse cx="160" cy="62" rx="55" ry="9" fill="#b9803f" />
      </svg>
    </div>
  );
}

export default function HeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hotspotRefs = useRef<(HTMLElement | null)[]>([]);
  const reducedMotion = !!useReducedMotion();

  // HeroCanvas only mounts after the loader finishes, i.e. on the client.
  const [mode, setMode] = useState<"webgl" | "fallback">(() =>
    detectWebGL() ? "webgl" : "fallback"
  );
  const mobile = useIsMobile();
  const [active, setActive] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(scrollYProgress, [0, 0.25], [0, -90]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.16], [1, 0]);

  // stop rendering when the hero is scrolled well out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "100px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const fail = () => setMode("fallback");

  return (
    <section id="home" ref={containerRef} className="relative h-[400vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#120C09]">
        {/* warm pool of light behind the product */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 70% at 68% 55%, rgba(212,148,58,0.22), transparent 70%), radial-gradient(ellipse 50% 60% at 15% 90%, rgba(107,31,42,0.35), transparent 70%)",
          }}
        />

        {/* 3D scene or still fallback */}
        <div className="absolute inset-0">
          {mode === "webgl" && (
            <SceneBoundary onError={fail}>
              <HeroScene
                progress={scrollYProgress}
                hotspotRefs={hotspotRefs}
                reducedMotion={reducedMotion}
                mobile={mobile}
                active={active}
                onFail={fail}
              />
            </SceneBoundary>
          )}
          {mode === "fallback" && <StaticTumbler />}
        </div>

        {/* Hotspots (positioned each frame by the scene) */}
        {mode === "webgl" && (
          <div className="absolute inset-0 pointer-events-none">
            {hotspots.map((h, i) => (
              <div
                key={h.title}
                ref={(el) => {
                  hotspotRefs.current[i] = el;
                }}
                className="group absolute left-0 top-0 opacity-0 will-change-transform"
              >
                <button
                  className="relative -ml-4 -mt-4 w-8 h-8 rounded-full border border-[#E3AE62] bg-[#120C09]/70 text-[#E3AE62] flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#E3AE62]"
                  aria-label={h.title}
                >
                  <span className="absolute inset-0 rounded-full border border-[#E3AE62]/60 animate-ping" />
                  <span className="text-sm leading-none">+</span>
                </button>
                <div
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 w-56 sm:w-64 p-4 bg-[#120C09]/90 border border-[#D4943A]/30 opacity-0 translate-y-1 group-hover:opacity-100 group-focus-within:opacity-100 group-hover:translate-y-0 group-focus-within:translate-y-0 transition duration-300 ${
                    i === 1 ? "right-6" : "left-6"
                  }`}
                >
                  <p
                    className="text-[#E3AE62] text-[0.6rem] uppercase mb-2"
                    style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.25em" }}
                  >
                    {h.title}
                  </p>
                  <p className="text-white/70 text-xs leading-relaxed">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* vignette keeps type readable without hiding the product */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120C09] via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#120C09]/80 via-[#120C09]/20 to-transparent pointer-events-none" />

        {/* Editorial headline, anchored left */}
        <div className="absolute inset-0 flex items-end md:items-center pointer-events-none">
          <motion.div
            style={{ y: textY, opacity: textOpacity }}
            className="pointer-events-auto px-6 md:px-16 lg:px-24 pb-28 md:pb-0 max-w-2xl"
          >
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="text-[#E3AE62] text-[0.65rem] md:text-xs uppercase mb-5"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }}
            >
              Kaapi Katha — filter coffee, reimagined
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-[2.6rem] sm:text-5xl lg:text-7xl text-[#F3E8D4] font-medium leading-[1.04] mb-5"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.01em" }}
            >
              A little more{" "}
              <span className="italic text-[#E3AE62]">India</span> in every pour.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="text-[#D4943A] text-base md:text-lg mb-6 sm:mb-6"
              style={{ fontFamily: "var(--font-deva)" }}
            >
              हर घूंट में थोड़ा और भारत
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="hidden sm:block text-white/60 text-sm md:text-base leading-relaxed mb-9 max-w-md"
            >
              Decoction dripped slow, milk steamed soft, and a steel tumbler
              that still feels right in your hands. Old rituals, poured for
              today.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
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
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 pointer-events-none"
        >
          <span
            className="text-white/30 text-[0.6rem] uppercase"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.25em" }}
          >
            Scroll to lean in
          </span>
          <motion.div
            animate={reducedMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-[1px] h-8 bg-gradient-to-b from-[#D4943A] to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
