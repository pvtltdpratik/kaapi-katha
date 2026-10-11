"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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

let webglSupport: boolean | null = null;
function detectWebGL() {
  if (webglSupport === null) {
    try {
      const c = document.createElement("canvas");
      webglSupport = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
}
const noopSubscribe = () => () => undefined;

/* ---- small building blocks ------------------------------------------ */

const legend = "text-sm font-medium text-fg mb-3";
const hint = "text-xs text-fg/50 mt-2";

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer ${
        active
          ? "border-fg bg-fg text-ground"
          : "border-fg/15 text-fg/75 hover:border-fg/40"
      }`}
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
    "w-10 h-10 border border-fg/15 flex items-center justify-center text-lg text-fg hover:border-fg/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={`Fewer ${name}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={base}
      >
        −
      </button>
      <span className="text-fg min-w-[24px] text-center tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={`More ${name}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={base}
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
      <p className="text-fg/55 text-sm max-w-[16rem] leading-relaxed">
        The 3D preview needs WebGL, which isn&apos;t available here. Your choices and the price still work.
      </p>
    </div>
  );
}

/* ---- the section ------------------------------------------------------ */

export default function DrinkCustomizer() {
  const { addToCart, setCartOpen } = useCart();
  const reduced = !!useReducedMotion();
  const webgl = useSyncExternalStore(noopSubscribe, detectWebGL, () => true);

  const [config, setConfig] = useState<BuilderConfig>(DEFAULT_CONFIG);
  const [stage, setStage] = useState("Preparing");
  const [replayToken, setReplayToken] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const [zoomed, setZoomed] = useState(false);
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
    // bottom of the glass to the top: syrup, espresso, milk, then toppings
    const s: string[] = [];
    if (config.syrup !== "None") s.push("Syrup");
    s.push("Espresso", "Milk");
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
    <section id="customizer" className="theme-espresso bg-ground text-fg relative py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <h2 className="display text-4xl md:text-6xl text-fg mb-14">Build your cup</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: the drink being made */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div
              id="cup-slot"
              ref={panelRef}
              className="relative h-[62vh] min-h-[420px] max-h-[600px] bg-surface overflow-hidden"
            >
              {webgl ? (
                <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                  <BuilderScene
                    cfgRef={cfgRef}
                    cream={config.cream}
                    replayToken={replayToken}
                    resetToken={resetToken}
                    zoomed={zoomed}
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

              <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none">
                <p className="text-sm text-fg/70" aria-live="polite">
                  {!webgl
                    ? ""
                    : stage === "Served"
                      ? "Served"
                      : stage === "Preparing"
                        ? "Getting ready"
                        : stage}
                </p>
                {webgl && (
                  <div className="pointer-events-auto flex items-center gap-4 text-sm">
                    {(
                      [
                        ["Replay", () => setReplayToken((n) => n + 1), false],
                        [zoomed ? "Farther" : "Closer", () => setZoomed((z) => !z), zoomed],
                        ["Reset view", () => { setResetToken((n) => n + 1); setZoomed(false); }, false],
                      ] as const
                    ).map(([text, fn]) => (
                      <button
                        key={text}
                        type="button"
                        onClick={fn}
                        className="text-fg/80 hover:text-accent underline underline-offset-4 decoration-fg/30 cursor-pointer"
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {webgl && (
                <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                <p className="text-sm text-fg mb-2" aria-live="polite">
                  {describeConfig(config)}
                </p>
                <ol className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Preparation steps">
                  {steps.map((s, i) => {
                    const state = i < stageIndex || stage === "Served" ? "done" : i === stageIndex ? "now" : "todo";
                    return (
                      <li
                        key={s}
                        className={`text-xs transition-colors ${
                          state === "now" ? "text-accent" : state === "done" ? "text-fg/70" : "text-fg/30"
                        }`}
                      >
                        {s}
                      </li>
                    );
                  })}
                </ol>
                </div>
              )}
            </div>
          </div>

          {/* Right: choices */}
          <div className="lg:col-span-7 space-y-9">
            <fieldset>
              <legend className={legend}>Size</legend>
              <div className="grid grid-cols-3 gap-3">
                {SIZES.map((s) => (
                  <Choice key={s} active={config.size === s} onClick={() => patch({ size: s })}>
                    {s}
                  </Choice>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={legend}>Milk</legend>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {MILKS.map((m) => (
                  <Choice key={m} active={config.milk === m} onClick={() => patch({ milk: m })}>
                    {m.replace(" Milk", "")}
                  </Choice>
                ))}
              </div>
              <p className={hint}>Oat, almond and coconut add ₹30.</p>
            </fieldset>

            <div>
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-sm font-medium text-fg">Espresso shots</span>
                <span className="text-sm text-fg/70 tabular-nums">
                  {config.shots > 1 ? `+₹${(config.shots - 1) * EXTRA_SHOT_PRICE}` : "Included"}
                </span>
              </div>
              <Stepper name="shots" value={config.shots} min={SHOTS_MIN} max={SHOTS_MAX} onChange={(v) => patch({ shots: v })} />
              <p className={hint}>The first shot is included; extra shots are ₹{EXTRA_SHOT_PRICE} each.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="syrup" className={`${legend} block`}>
                  Syrup
                </label>
                <select
                  id="syrup"
                  value={config.syrup}
                  onChange={(e) => patch({ syrup: e.target.value as BuilderConfig["syrup"] })}
                  className="w-full bg-ground border border-fg/15 text-fg text-sm p-3 focus:outline-none focus:border-accent rounded-none cursor-pointer"
                >
                  {SYRUPS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {config.syrup !== "None" && (
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <span className="text-sm font-medium text-fg">Pumps</span>
                    <span className="text-sm text-fg/70 tabular-nums">+₹{config.pumps * PUMP_PRICE}</span>
                  </div>
                  <Stepper name="pumps" value={config.pumps} min={PUMPS_MIN} max={PUMPS_MAX} onChange={(v) => patch({ pumps: v })} />
                </div>
              )}
            </div>

            <fieldset>
              <legend className={legend}>Toppings</legend>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ["cream", "Fresh cream", TOPPING_PRICE.cream],
                    ["drizzle", "Jaggery drizzle", TOPPING_PRICE.drizzle],
                    ["cinnamon", "Cinnamon", TOPPING_PRICE.cinnamon],
                  ] as const
                ).map(([key, text, price]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={config[key]}
                    onClick={() => patch({ [key]: !config[key] } as Partial<BuilderConfig>)}
                    className={`border px-3 py-3 text-sm font-medium transition-colors duration-200 flex items-center justify-between gap-2 cursor-pointer ${
                      config[key]
                        ? "border-fg bg-fg text-ground"
                        : "border-fg/15 text-fg/75 hover:border-fg/40"
                    }`}
                  >
                    <span className="text-left">{text}</span>
                    <span className="text-xs tabular-nums opacity-70 whitespace-nowrap">+₹{price}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* total and add */}
            <div className="border-t border-fg/15 pt-6">
              <ul className="space-y-1.5 mb-5">
                {lines.map((l) => (
                  <li key={l.label} className="flex justify-between text-sm">
                    <span className="text-fg/65">{l.label}</span>
                    <span className="text-fg/85 tabular-nums">₹{l.amount}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-baseline mb-6">
                <span className="text-sm font-medium text-fg">Total</span>
                <span className="display text-3xl text-fg tabular-nums">₹{total}</span>
              </div>
              <button type="button" onClick={handleAddToOrder} className="btn w-full justify-center py-4">
                Add to order
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
