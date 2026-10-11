"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import {
  DEFAULT_CONFIG,
  EXTRA_SHOT_PRICE,
  MILKS,
  PUMPS_MAX,
  PUMPS_MIN,
  PUMP_PRICE,
  SHOTS_MAX,
  SHOTS_MIN,
  SIZES,
  SYRUPS,
  TOPPING_PRICE,
  configId,
  describeConfig,
  priceBreakdown,
  totalPrice,
  type BuilderConfig,
} from "@/lib/builderConfig";

const BuilderScene = dynamic(() => import("./BuilderScene"), { ssr: false });

const COMPACT_QUERY = "(max-width: 1023px)";

function detectWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/* ---- small building blocks ------------------------------------------ */

const label = "text-white/45 text-[0.65rem] tracking-wider uppercase font-mono";

function Choice({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border p-3 text-xs tracking-wider font-bold transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3AE62] ${
        active
          ? "border-[#D4943A] text-[#D4943A] bg-[#D4943A]/5"
          : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  name,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  name: string;
}) {
  const base =
    "w-10 h-10 border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3AE62] disabled:opacity-30 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Fewer ${name}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={`${base} border-white/10 text-white hover:border-white/30 hover:text-[#D4943A]`}
      >
        −
      </button>
      <span className="text-white text-sm min-w-[24px] text-center font-mono" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`More ${name}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={`${base} border-white/10 text-white hover:border-white/30 hover:text-[#D4943A]`}
      >
        +
      </button>
    </div>
  );
}

function StaticPreview() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-8">
      <svg viewBox="0 0 220 170" className="w-48 h-auto" role="img" aria-label="A ceramic cup of coffee on a saucer">
        <ellipse cx="110" cy="146" rx="92" ry="12" fill="#f0ece3" opacity="0.9" />
        <path d="M45 50 H175 C175 110 150 140 110 140 C70 140 45 110 45 50 Z" fill="#f0ece3" />
        <path d="M172 62 C206 58 206 108 168 108" fill="none" stroke="#f0ece3" strokeWidth="11" strokeLinecap="round" />
        <ellipse cx="110" cy="50" rx="65" ry="12" fill="#e4dfd4" />
        <ellipse cx="110" cy="53" rx="56" ry="9" fill="#6b4425" />
      </svg>
      <p className="text-white/40 text-xs max-w-[16rem] leading-relaxed">
        The live 3D preparation needs WebGL, which isn&apos;t available here. Your selections and price still work.
      </p>
    </div>
  );
}

/* ---- the section ------------------------------------------------------ */

export default function DrinkCustomizer() {
  const { addToCart, setCartOpen } = useCart();
  const reduced = !!useReducedMotion();

  const [config, setConfig] = useState<BuilderConfig>(DEFAULT_CONFIG);
  const [stage, setStage] = useState("Preparing");
  const [replayToken, setReplayToken] = useState(0);
  const [webgl] = useState(() => (typeof document === "undefined" ? true : detectWebGL()));
  const [compact, setCompact] = useState(false);
  const [active, setActive] = useState(true);

  const panelRef = useRef<HTMLDivElement>(null);
  const cfgRef = useRef<BuilderConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    cfgRef.current = config;
  }, [config]);

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_QUERY);
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // only render the scene while the panel is near the viewport
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const patch = (p: Partial<BuilderConfig>) => setConfig((c) => ({ ...c, ...p }));

  const lines = useMemo(() => priceBreakdown(config), [config]);
  const total = useMemo(() => totalPrice(config), [config]);
  const hasToppings = config.cream || config.drizzle || config.cinnamon;

  const steps = useMemo(() => {
    const s = ["Espresso", "Milk"];
    if (config.syrup !== "None") s.push("Syrup");
    if (hasToppings) s.push("Toppings");
    s.push("Served");
    return s;
  }, [config.syrup, hasToppings]);
  const stageIndex = steps.indexOf(stage);

  const handleAddToOrder = () => {
    addToCart({
      id: configId(config),
      name: `Your Kaapi (${config.size})`,
      subtitle: describeConfig(config),
      description: `A ${config.size.toLowerCase()} cup built by you: ${describeConfig(config)}.`,
      price: `₹${total}`,
      image: "/images/coffee/menu_custom_5.jpg",
      config,
    });
    setCartOpen(true);
  };

  return (
    <section id="customizer" className="relative py-24 md:py-32 bg-[#120C09] overflow-hidden border-t border-white/5">
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#D4943A]/5 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-[#D4943A] text-[0.6rem] md:text-[0.7rem] uppercase tracking-[0.3em] block mb-3 font-mono font-bold">
            Your Cup, Your Way
          </span>
          <h2
            className="text-3xl md:text-5xl text-white font-semibold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Build Your Cup
          </h2>
          <div className="w-12 h-[1px] bg-[#D4943A] mx-auto mt-4" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left: live preparation scene */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div
              id="cup-slot"
              ref={panelRef}
              className="relative h-[62vh] min-h-[420px] max-h-[600px] border border-white/10 overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 50% 62%, rgba(212,148,58,0.16), rgba(18,12,9,0) 70%), linear-gradient(#17100c, #120C09)",
              }}
            >
              {webgl ? (
                <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                  <BuilderScene
                    cfgRef={cfgRef}
                    cream={config.cream}
                    replayToken={replayToken}
                    reducedMotion={reduced}
                    mobile={compact}
                    active={active}
                    onStage={setStage}
                    onFail={() => undefined}
                  />
                </div>
              ) : (
                <StaticPreview />
              )}

              {/* overlays keep clear of the product */}
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
                <div>
                  <p className="text-white/35 text-[0.62rem] uppercase tracking-widest font-mono">Live preview</p>
                  {webgl && (
                    <p className="mt-1 text-[#E3AE62] text-xs font-mono" aria-live="polite">
                      {stage === "Served" ? "Ready to serve" : stage === "Preparing" ? "Getting ready…" : `${stage}…`}
                    </p>
                  )}
                </div>
                {webgl && (
                  <button
                    type="button"
                    onClick={() => setReplayToken((n) => n + 1)}
                    className="pointer-events-auto border border-white/15 text-white/70 hover:text-[#E3AE62] hover:border-[#D4943A] transition-colors text-[0.65rem] uppercase tracking-widest font-mono px-3 py-2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3AE62] bg-[#120C09]/60"
                  >
                    ↻ Replay
                  </button>
                )}
              </div>

              <div className="absolute bottom-0 inset-x-0 p-4 pointer-events-none bg-gradient-to-t from-[#120C09] via-[#120C09]/80 to-transparent">
                {webgl && (
                  <ol className="flex flex-wrap gap-x-4 gap-y-1 mb-3" aria-label="Preparation steps">
                    {steps.map((s, i) => {
                      const state = i < stageIndex || stage === "Served" ? "done" : i === stageIndex ? "now" : "todo";
                      return (
                        <li
                          key={s}
                          className={`text-[0.6rem] uppercase tracking-widest font-mono transition-colors ${
                            state === "now" ? "text-[#E3AE62]" : state === "done" ? "text-white/60" : "text-white/20"
                          }`}
                        >
                          {state === "done" ? "✓ " : ""}
                          {s}
                        </li>
                      );
                    })}
                  </ol>
                )}
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-white/40 text-[0.6rem] tracking-wider uppercase font-mono block">Estimated price</span>
                    <p className="text-3xl text-white font-semibold font-mono leading-tight">₹{total}</p>
                  </div>
                  {webgl && <span className="text-white/25 text-[0.6rem] uppercase tracking-widest font-mono">Drag to turn</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Right: controls */}
          <div className="lg:col-span-7 space-y-8">
            <fieldset>
              <legend className={`${label} mb-3`}>1. Choose size</legend>
              <div className="grid grid-cols-3 gap-3">
                {SIZES.map((s) => (
                  <Choice key={s} active={config.size === s} onClick={() => patch({ size: s })}>
                    {s.toUpperCase()}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={`${label} mb-3`}>2. Milk option</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MILKS.map((m) => (
                  <Choice key={m} active={config.milk === m} onClick={() => patch({ milk: m })} className="!text-[10px]">
                    {m.toUpperCase()}
                  </Choice>
                ))}
              </div>
              <p className="text-white/30 text-[0.65rem] mt-2 font-mono">Oat, almond and coconut add ₹30.</p>
            </fieldset>

            <div>
              <div className="flex justify-between items-center mb-3">
                <span className={label}>3. Espresso shots</span>
                <span className="text-[#D4943A] text-xs font-mono font-bold">
                  {config.shots} {config.shots === 1 ? "shot" : "shots"}
                  {config.shots > 1 && <span className="text-white/35 font-normal"> · +₹{(config.shots - 1) * EXTRA_SHOT_PRICE}</span>}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Stepper
                  name="shots"
                  value={config.shots}
                  min={SHOTS_MIN}
                  max={SHOTS_MAX}
                  onChange={(v) => patch({ shots: v })}
                />
                <div className="flex-1 h-[2px] bg-white/10 relative">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#D4943A] transition-[width] duration-300"
                    style={{ width: `${(config.shots / SHOTS_MAX) * 100}%` }}
                  />
                </div>
              </div>
              <p className="text-white/30 text-[0.65rem] mt-2 font-mono">First shot is included; extra shots are ₹{EXTRA_SHOT_PRICE} each.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="syrup" className={`${label} block mb-3`}>
                  4. Syrup choice
                </label>
                <select
                  id="syrup"
                  value={config.syrup}
                  onChange={(e) => patch({ syrup: e.target.value as BuilderConfig["syrup"] })}
                  className="w-full bg-[#180F0B] border border-white/10 text-white text-xs tracking-wider p-3 focus:outline-none focus:border-[#D4943A] rounded-none cursor-pointer"
                >
                  {SYRUPS.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {config.syrup !== "None" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={label}>Syrup pumps</span>
                    <span className="text-[#D4943A] text-xs font-mono font-bold">
                      +₹{config.pumps * PUMP_PRICE}
                    </span>
                  </div>
                  <Stepper
                    name="pumps"
                    value={config.pumps}
                    min={PUMPS_MIN}
                    max={PUMPS_MAX}
                    onChange={(v) => patch({ pumps: v })}
                  />
                </div>
              )}
            </div>

            <fieldset>
              <legend className={`${label} mb-3`}>5. Add toppings</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ["cream", "FRESH CREAM", TOPPING_PRICE.cream],
                    ["drizzle", "JAGGERY DRIZZLE", TOPPING_PRICE.drizzle],
                    ["cinnamon", "CINNAMON", TOPPING_PRICE.cinnamon],
                  ] as const
                ).map(([key, text, price]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={config[key]}
                    onClick={() => patch({ [key]: !config[key] } as Partial<BuilderConfig>)}
                    className={`border px-3 py-4 text-[11px] tracking-wider transition-all duration-300 flex items-center justify-between cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3AE62] ${
                      config[key]
                        ? "border-[#D4943A] text-[#D4943A] bg-[#D4943A]/5"
                        : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className="text-left">{text}</span>
                    <span className="text-[9px] font-mono opacity-80 whitespace-nowrap pl-2">+₹{price}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* price breakdown + CTA */}
            <div className="border border-white/10 p-5">
              <ul className="space-y-1.5 mb-4">
                {lines.map((l) => (
                  <li key={l.label} className="flex justify-between text-xs">
                    <span className="text-white/55">{l.label}</span>
                    <span className="text-white/80 font-mono">₹{l.amount}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-baseline border-t border-white/10 pt-3 mb-5">
                <span className="text-white text-xs uppercase tracking-widest font-mono">Total</span>
                <span className="text-[#E3AE62] text-xl font-mono font-semibold">₹{total}</span>
              </div>
              <button
                type="button"
                onClick={handleAddToOrder}
                className="w-full btn-cta text-center justify-center font-bold text-xs tracking-widest py-4 cursor-pointer"
              >
                ADD MY CUP TO ORDER · ₹{total}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
