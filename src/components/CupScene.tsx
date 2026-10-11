"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { CupBody, Liquid, StudioEnvironment, makeLiquidState, type LiquidState } from "./CupModel";

/* ------------------------------------------------------------------ */
/* Scroll choreography                                                 */
/* ------------------------------------------------------------------ */
/*
 * A key says: "when <edge> of <sel> sits at <vp> (0 = top, 1 = bottom) of the
 * viewport, the cup should look like this". Positions are measured from the
 * real DOM, so the path follows the layout instead of guessing pixel values.
 *
 *   x, y   viewport-normalised: -1..1, +y is up
 *   s      scale multiplier on the auto-fitted base size
 *   rz     clockwise lean in degrees (negative leans to the right)
 *   rx     pitch towards the viewer (shows the coffee surface)
 *   ry     yaw / spin
 *   lin    interpolate linearly into this key (used when the cup should move
 *          at exactly the page's own speed)
 */

interface KeyDef {
  sel: string;
  edge: "top" | "center" | "bottom";
  vp: number;
  x: number;
  y: number;
  s: number;
  rz: number;
  rx: number;
  ry: number;
  lin?: boolean;
  /** take x from the element's horizontal centre instead of `x` */
  anchorX?: boolean;
}

const DESKTOP_KEYS: KeyDef[] = [
  // hero: big, right of the headline, leaning clockwise
  { sel: "#home", edge: "top", vp: 0, x: 0.43, y: 0.0, s: 1.0, rz: -13, rx: 20, ry: -30 },
  // story: zig-zag opposite each text block
  { sel: '[data-cup="story-0"]', edge: "center", vp: 0.5, x: 0.55, y: 0, s: 0.78, rz: -10, rx: 20, ry: 24 },
  { sel: '[data-cup="story-1"]', edge: "center", vp: 0.5, x: -0.55, y: 0, s: 0.78, rz: 10, rx: 20, ry: 168 },
  { sel: '[data-cup="story-2"]', edge: "center", vp: 0.5, x: 0.55, y: 0, s: 0.78, rz: -10, rx: 20, ry: 336 },
  // menu: right lane
  { sel: "#menu", edge: "center", vp: 0.5, x: 0.6, y: 0, s: 0.88, rz: -14, rx: 22, ry: 392 },
  // customizer: glides to the preview panel, then hands over to the panel's own
  // scene (which shows the drink being prepared) by shrinking out
  { sel: "#cup-slot", edge: "center", vp: 0.9, x: -0.5, y: 0, s: 0.8, rz: -4, rx: 26, ry: 430, anchorX: true },
  { sel: "#cup-slot", edge: "center", vp: 0.62, x: -0.5, y: 0, s: 0.001, rz: -4, rx: 26, ry: 460, anchorX: true },
  // gallery: left lane
  { sel: "#gallery", edge: "center", vp: 0.5, x: -0.6, y: 0, s: 0.8, rz: 11, rx: 20, ry: 500 },
  // rituals: right lane
  { sel: "#rituals", edge: "center", vp: 0.5, x: 0.6, y: 0, s: 0.8, rz: -12, rx: 20, ry: 570 },
  // about: left, where the photo used to be
  { sel: '[data-cup="about"]', edge: "center", vp: 0.5, x: -0.5, y: 0, s: 0.88, rz: -6, rx: 22, ry: 640, anchorX: true },
];

/*
 * Phones / tablets: no side lanes exist, so the cup sits above the headline,
 * scrolls away with the hero, and returns as the customizer's preview.
 */
const MOBILE_KEYS: KeyDef[] = [
  { sel: "#home", edge: "top", vp: 0, x: 0, y: 0.5, s: 1.7, rz: -13, rx: 20, ry: -30 },
  { sel: "#home", edge: "bottom", vp: 0.15, x: 0, y: 1.6, s: 0.001, rz: -14, rx: 24, ry: 10 },
];

interface ResolvedKey extends KeyDef {
  scroll: number;
}

function resolveKeys(defs: KeyDef[], vw: number, vh: number): ResolvedKey[] {
  const out: ResolvedKey[] = [];
  for (const d of defs) {
    const el = document.querySelector(d.sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const point =
      d.edge === "top" ? top : d.edge === "bottom" ? top + r.height : top + r.height / 2;
    out.push({
      ...d,
      x: d.anchorX ? ((r.left + r.width / 2) / vw) * 2 - 1 : d.x,
      scroll: point - d.vp * vh,
    });
  }
  out.sort((a, b) => a.scroll - b.scroll);
  for (let i = 1; i < out.length; i++) {
    if (out[i].scroll <= out[i - 1].scroll + 1) out[i].scroll = out[i - 1].scroll + 1;
  }
  return out;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = THREE.MathUtils.lerp;
const DEG = Math.PI / 180;

/** pivot the cup about its visual centre (body + handle) */
const CUP_CENTER = new THREE.Vector3(-0.25, -0.72, 0);

/* ------------------------------------------------------------------ */
/* Rig: reads window.scrollY every frame and writes the transform      */
/* ------------------------------------------------------------------ */

const FOV = 30;
const DIST = 12;

interface Pose {
  x: number;
  y: number;
  s: number;
  rz: number;
  rx: number;
  ry: number;
}

function Rig({ mobile, reducedMotion }: { mobile: boolean; reducedMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const keys = useRef<ResolvedKey[]>([]);
  const cur = useRef<Pose | null>(null);
  // the hero cup is always a finished latte
  const liquid = useRef<LiquidState>(makeLiquidState());

  // measure the page; re-measure whenever layout changes
  useEffect(() => {
    const defs = mobile ? MOBILE_KEYS : DESKTOP_KEYS;
    const measure = () => {
      keys.current = resolveKeys(defs, window.innerWidth, window.innerHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    const late = window.setTimeout(measure, 1200); // fonts / images settling
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(late);
    };
  }, [mobile]);

  useFrame((fs, dt) => {
    const ks = keys.current;
    if (!ks.length || !root.current || !tilt.current || !spin.current) return;

    const vh = fs.size.height;
    const y = window.scrollY;
    const last = ks.length - 1;

    // --- target pose from scroll -----------------------------------
    let a = ks[0];
    let b = ks[0];
    let t = 0;
    let carry = 0; // px scrolled beyond the final key
    if (y >= ks[last].scroll) {
      a = b = ks[last];
      carry = y - ks[last].scroll;
    } else if (y > ks[0].scroll) {
      let i = 0;
      while (i < last - 1 && y >= ks[i + 1].scroll) i++;
      a = ks[i];
      b = ks[i + 1];
      t = (y - a.scroll) / (b.scroll - a.scroll);
      if (!(a.lin || b.lin)) t = smooth(t);
    }
    const target: Pose = {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t) + (carry / (vh / 2)),
      s: lerp(a.s, b.s, t),
      rz: lerp(a.rz, b.rz, t),
      rx: lerp(a.rx, b.rx, t),
      ry: lerp(a.ry, b.ry, t),
    };

    // --- critically damped follow: removes wheel-step jitter -------
    if (!cur.current) cur.current = { ...target };
    const k = reducedMotion ? 1 : 1 - Math.exp(-11 * dt);
    const p = cur.current;
    (Object.keys(p) as (keyof Pose)[]).forEach((key) => {
      p[key] += (target[key] - p[key]) * k;
    });

    // --- idle (only a breath of motion) ----------------------------
    const time = reducedMotion ? 0 : fs.clock.elapsedTime;
    const bob = Math.sin(time * 0.8) * 0.02;
    const sway = Math.sin(time * 0.55) * 0.012;
    const turn = Math.sin(time * 0.35) * 0.035;

    // --- viewport -> world -----------------------------------------
    const aspect = fs.size.width / fs.size.height;
    const halfH = Math.tan((FOV * DEG) / 2) * DIST;
    const halfW = halfH * aspect;
    // fit: ~52% of viewport height, never wider than ~36% of viewport width
    const base = Math.min((halfH * 2 * 0.52) / 1.5, (halfW * 2 * 0.36) / 2.6);

    const appear = reducedMotion ? 1 : 1 - Math.pow(1 - Math.min(fs.clock.elapsedTime / 1.4, 1), 3);

    root.current.position.set(p.x * halfW, (p.y + bob) * halfH, 0);
    root.current.scale.setScalar(Math.max(base * p.s * (0.9 + 0.1 * appear), 0.0001));
    tilt.current.rotation.set(p.rx * DEG, 0, p.rz * DEG + sway, "ZXY");
    spin.current.rotation.y = p.ry * DEG + turn;
  });

  return (
    <>
      <ambientLight intensity={0.18} color="#ffe9d2" />
      <directionalLight
        color="#fff1de"
        intensity={3.2}
        position={[-4, 5, 6]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0004}
      />
      <directionalLight color="#cfe0ff" intensity={1.1} position={[5, 2, -4]} />
      <group ref={root}>
        <group ref={tilt}>
          <group ref={spin}>
            <group position={CUP_CENTER}>
              <CupBody />
              <Liquid state={liquid} />
            </group>
          </group>
        </group>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export default function CupScene({
  mobile,
  reducedMotion,
  onFail,
}: {
  mobile: boolean;
  reducedMotion: boolean;
  onFail: () => void;
}) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ fov: FOV, position: [0, 0, DIST], near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.9;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      aria-hidden
    >
      <StudioEnvironment intensity={0.9} />
      <Rig mobile={mobile} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
