"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CupBody, Liquid, Saucer, StudioEnvironment, makeLiquidState, type LiquidState } from "./CupModel";
import { SAUCER_WELL_Y, innerRadiusAt } from "@/lib/cupGeometry";
import { SIZE_SCALE, configKey, type BuilderConfig, type MilkType, type SyrupType } from "@/lib/builderConfig";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CUP_Y = SAUCER_WELL_Y;
const LEVEL_EMPTY = 0.23;
const LEVEL_FINAL = 1.15;
const NOZZLE_Y = 3.15; // centre of the espresso group head
const NOZZLE_TIP_Y = -0.36; // spout centre, relative to the group head
const NOZZLE_STREAM_DROP = 0.49; // where the stream leaves the spout

const MILK_COLOR: Record<MilkType, string> = {
  "Whole Milk": "#f7efe2",
  "Oat Milk": "#e9d9bd",
  "Almond Milk": "#ecdcc2",
  "Coconut Milk": "#f8f2e8",
};
const SYRUP_COLOR: Record<SyrupType, string> = {
  None: "#000000",
  Jaggery: "#8a4a10",
  Cardamom: "#b9a85a",
  Rose: "#d9899f",
};
const ESPRESSO_TINT = new THREE.Color("#5e4130");

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth01 = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => t * t * (3 - 2 * t);
const prog = (t: number, r: [number, number] | null) => (r ? clamp01((t - r[0]) / (r[1] - r[0])) : 0);
/** 0 → 1 → 0 envelope across a window, soft at both ends */
const window01 = (t: number, r: [number, number] | null, fade = 0.18) =>
  r ? smooth01(r[0], r[0] + fade, t) * (1 - smooth01(r[1] - fade, r[1], t)) : 0;

/* ------------------------------------------------------------------ */
/* The preparation plan: when each stage starts and ends               */
/* ------------------------------------------------------------------ */

type Range = [number, number];
interface Plan {
  esp: Range;
  milk: Range;
  syr: Range | null;
  cream: Range | null;
  driz: Range | null;
  cin: Range | null;
  serve: number;
  total: number;
  firstTopping: number | null;
}

function buildPlan(c: BuilderConfig): Plan {
  let t = 0.7;
  const esp: Range = [t, t + 1.1 + 0.75 * c.shots];
  t = esp[1] + 0.4;
  const milk: Range = [t, t + 3.0];
  t = milk[1] + 0.4;
  let syr: Range | null = null;
  if (c.syrup !== "None") {
    syr = [t, t + 0.5 + c.pumps * 0.55];
    t = syr[1] + 0.4;
  }
  const firstTopping = c.cream || c.drizzle || c.cinnamon ? t : null;
  let cream: Range | null = null;
  let driz: Range | null = null;
  let cin: Range | null = null;
  if (c.cream) {
    cream = [t, t + 1.0];
    t = cream[1] + 0.25;
  }
  if (c.drizzle) {
    driz = [t, t + 1.4];
    t = driz[1] + 0.25;
  }
  if (c.cinnamon) {
    cin = [t, t + 1.5];
    t = cin[1] + 0.25;
  }
  return { esp, milk, syr, cream, driz, cin, serve: t + 0.1, total: t + 2.2, firstTopping };
}

function stageAt(t: number, p: Plan): string {
  if (t >= p.serve) return "Served";
  if (p.firstTopping !== null && t >= p.firstTopping) return "Toppings";
  if (p.syr && t >= p.syr[0]) return "Syrup";
  if (t >= p.milk[0]) return "Milk";
  if (t >= p.esp[0]) return "Espresso";
  return "Preparing";
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const PITCHER_TIP = new THREE.Vector3(-0.64, 0.9, 0); // spout tip in pitcher space

function Pitcher({ material }: { material: THREE.Material }) {
  const body = useMemo(
    () =>
      new THREE.LatheGeometry(
        [
          [0, 0],
          [0.3, 0],
          [0.34, 0.05],
          [0.43, 0.75],
          [0.46, 0.9],
          [0.43, 0.9],
          [0.4, 0.8],
          [0, 0.1],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        48
      ),
    []
  );
  const handle = useMemo(() => new THREE.TorusGeometry(0.26, 0.04, 12, 28, Math.PI), []);
  const spout = useMemo(() => new THREE.ConeGeometry(0.16, 0.34, 24, 1, true), []);
  useEffect(
    () => () => {
      body.dispose();
      handle.dispose();
      spout.dispose();
    },
    [body, handle, spout]
  );
  return (
    <group>
      <mesh geometry={body} material={material} castShadow />
      <mesh geometry={handle} material={material} position={[0.46, 0.46, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow />
      <mesh geometry={spout} material={material} position={[-0.52, 0.86, 0]} rotation={[0, 0, Math.PI / 2 + 0.35]} castShadow />
    </group>
  );
}

function makeSoftTexture(kind: "steam" | "shadow") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  if (kind === "shadow") {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.75)");
    g.addColorStop(0.55, "rgba(0,0,0,0.28)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  } else {
    // wispy vapour: overlapping faint blobs under a radial falloff
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 26; i++) {
      const x = 64 + (rnd() - 0.5) * 60;
      const y = 64 + (rnd() - 0.5) * 70;
      const r = 10 + rnd() * 22;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,250,242,0.16)");
      g.addColorStop(1, "rgba(255,250,242,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(0.7, "rgba(0,0,0,0.5)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ------------------------------------------------------------------ */
/* The scene                                                           */
/* ------------------------------------------------------------------ */

interface SceneProps {
  cfgRef: RefObject<BuilderConfig>;
  /** whether cream is selected (rebuilds the drizzle path) */
  cream: boolean;
  replayToken: number;
  reducedMotion: boolean;
  mobile: boolean;
  onStage: (stage: string) => void;
}

const STEAM_COUNT = 14;
const CINNAMON_COUNT = 70;

function Scene({ cfgRef, cream: withCream, replayToken, reducedMotion, mobile, onStage }: SceneProps) {
  const gl = useThree((s) => s.gl);

  // ---- refs to animated objects --------------------------------------
  const cupGroup = useRef<THREE.Group>(null);
  const nozzle = useRef<THREE.Group>(null);
  const pitcher = useRef<THREE.Group>(null);
  const bottle = useRef<THREE.Group>(null);
  const espStream = useRef<THREE.Mesh>(null);
  const milkStream = useRef<THREE.Mesh>(null);
  const syrStream = useRef<THREE.Mesh>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const rippleMat = useRef<THREE.MeshBasicMaterial>(null);
  const cream = useRef<THREE.Mesh>(null);
  const drizzle = useRef<THREE.Mesh>(null);
  const cinnamon = useRef<THREE.InstancedMesh>(null);
  const steam = useRef<(THREE.Sprite | null)[]>([]);
  const blob = useRef<THREE.Mesh>(null);

  // ---- simulation state (mutated per frame, never rendered) ----------
  const liquid = useRef<LiquidState>(makeLiquidState());
  const sim = useRef({
    t: 0,
    started: false,
    key: "",
    plan: null as Plan | null,
    stage: "",
    yaw: 0.5,
    yawVel: 0,
    drag: false,
    lastX: 0,
    cfgForGeom: "",
  });

  // ---- shared resources ------------------------------------------------
  const res = useMemo(() => {
    const steel = new THREE.MeshStandardMaterial({ color: "#d6d9dd", metalness: 1, roughness: 0.22, side: THREE.DoubleSide });
    const brass = new THREE.MeshStandardMaterial({ color: "#b98a3a", metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
    const mk = (color: string, rough: number) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.96 });
    return {
      steel,
      brass,
      espressoMat: mk("#2a1307", 0.12),
      milkMat: mk("#f6efe3", 0.3),
      syrupMat: mk("#8a4a10", 0.1),
      stream: new THREE.CylinderGeometry(1, 1, 1, 20, 1, true),
      nozzleBody: new THREE.CylinderGeometry(0.26, 0.3, 0.46, 32),
      nozzleTip: new THREE.CylinderGeometry(0.07, 0.14, 0.26, 20),
      ripple: new THREE.RingGeometry(0.55, 1, 48),
      dollop: new THREE.LatheGeometry(
        [
          [0, 0],
          [0.5, 0],
          [0.55, 0.05],
          [0.5, 0.12],
          [0.43, 0.15],
          [0.46, 0.2],
          [0.39, 0.27],
          [0.3, 0.3],
          [0.32, 0.35],
          [0.23, 0.41],
          [0.1, 0.47],
          [0, 0.5],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        40
      ),
      speck: new THREE.SphereGeometry(0.016, 6, 5),
      steamTex: makeSoftTexture("steam"),
      shadowTex: makeSoftTexture("shadow"),
      creamMat: new THREE.MeshPhysicalMaterial({ color: "#fbf7ee", roughness: 0.55, clearcoat: 0.25 }),
      drizzleMat: new THREE.MeshPhysicalMaterial({ color: "#8a4a10", roughness: 0.12, clearcoat: 1 }),
      speckMat: new THREE.MeshStandardMaterial({ color: "#6a3a1b", roughness: 0.9 }),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(res).forEach((v) => {
        if (v && typeof (v as { dispose?: () => void }).dispose === "function") (v as { dispose: () => void }).dispose();
      });
    },
    [res]
  );

  // ---- the drizzle line is rebuilt only when the cream choice changes --
  const drizzleGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const turns = 2.6;
    for (let i = 0; i <= 140; i++) {
      const u = i / 140;
      const a = u * Math.PI * 2 * turns;
      const r = 0.04 + u * (withCream ? 0.42 : 0.62);
      const dome = withCream ? 0.5 * (1 - Math.pow(r / 0.58, 1.8)) + 0.02 : 0.014;
      pts.push(new THREE.Vector3(Math.cos(a) * r, LEVEL_FINAL + dome, Math.sin(a) * r));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.017, 8, false);
  }, [withCream]);
  useEffect(() => () => drizzleGeo.dispose(), [drizzleGeo]);

  const speckData = useMemo(() => {
    const h = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: CINNAMON_COUNT }, (_, i) => {
      const r = Math.sqrt(h(i * 5 + 1)) * 0.7;
      const a = h(i * 5 + 2) * Math.PI * 2;
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, delay: h(i * 5 + 3) * 0.65, s: 0.7 + h(i * 5 + 4) * 0.9, spin: h(i * 5 + 5) * 6 };
    });
  }, []);

  // ---- restart the preparation whenever replay is pressed --------------
  useEffect(() => {
    sim.current.t = 0;
    sim.current.started = false;
  }, [replayToken]);

  // ---- drag to turn the cup -------------------------------------------
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      sim.current.drag = true;
      sim.current.lastX = e.clientX;
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!sim.current.drag) return;
      const dx = e.clientX - sim.current.lastX;
      sim.current.lastX = e.clientX;
      sim.current.yawVel = dx * 0.012;
      sim.current.yaw += dx * 0.012;
    };
    const up = () => {
      sim.current.drag = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  const scratch = useRef({
    tip: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    rest: new THREE.Vector3(),
    sTip: new THREE.Vector3(),
    sRest: new THREE.Vector3(),
    esp: new THREE.Color(),
    milk: new THREE.Color(),
    a: new THREE.Matrix4(),
    q: new THREE.Quaternion(),
    s: new THREE.Vector3(),
    e: new THREE.Euler(),
  });

  useFrame((fs, dt) => {
    const cfg = cfgRef.current;
    const v = scratch.current;
    const S = sim.current;
    const st = liquid.current;
    if (!cfg || !cupGroup.current) return;

    // plan (re)build + restart when the drink changes
    const key = configKey(cfg);
    if (key !== S.key || !S.plan) {
      S.key = key;
      S.plan = buildPlan(cfg);
      S.t = 0;
    }
    const plan = S.plan;

    // hand-off with the page-wide cup: appear as the slot scrolls into view
    const slot = document.getElementById("cup-slot");
    let appear = 1;
    if (slot) {
      const r = slot.getBoundingClientRect();
      const p = (r.top + r.height / 2) / window.innerHeight;
      appear = window.innerWidth >= 1024 ? smooth01(0.9, 0.64, p) : smooth01(1.05, 0.85, p);
    }
    if (appear < 0.2) {
      S.t = 0;
      S.started = false;
    } else if (appear > 0.9) {
      S.started = true;
    }
    if (reducedMotion) S.t = plan.total;
    else if (S.started) S.t = Math.min(S.t + Math.min(dt, 0.05), plan.total + 30); // clamp: a throttled tab must not skip stages
    const t = S.t;

    // ---- liquid level ---------------------------------------------
    const lEsp = LEVEL_EMPTY + 0.12 + cfg.shots * 0.1;
    const pe = ease(prog(t, plan.esp));
    const pm = ease(prog(t, plan.milk));
    const level = LEVEL_EMPTY + (lEsp - LEVEL_EMPTY) * pe + (LEVEL_FINAL - lEsp) * pm;
    st.level = level;

    v.milk.set(MILK_COLOR[cfg.milk]);
    v.esp.copy(ESPRESSO_TINT).lerp(v.milk, pm * 0.7);
    st.tint.copy(v.esp);
    st.foam = 1 - 0.65 * pm;
    st.art = smooth01(0.72, 1, pm) * (cfg.cream ? 0.6 : 1);
    const ps = ease(prog(t, plan.syr));
    st.syrupColor.set(SYRUP_COLOR[cfg.syrup]);
    st.syrup = cfg.syrup === "None" ? 0 : 0.85 * ps * (1 - 0.45 * smooth01(plan.serve, plan.serve + 3, t));

    // ---- cup + size -------------------------------------------------
    const sizeScale = SIZE_SCALE[cfg.size];
    const sc = Math.max(sizeScale * (0.4 + 0.6 * ease(appear)), 0.0001);
    cupGroup.current.visible = appear > 0.02;
    cupGroup.current.scale.setScalar(sc);
    cupGroup.current.position.y = CUP_Y;

    // yaw: drag, then ease back towards a flattering resting angle
    if (!S.drag) {
      S.yawVel *= Math.exp(-4 * dt);
      S.yaw += S.yawVel * 0.0;
      const rest = 0.5 + (reducedMotion ? 0 : Math.sin(fs.clock.elapsedTime * 0.3) * 0.04);
      S.yaw += (rest - S.yaw) * (1 - Math.exp(-0.6 * dt));
    }
    cupGroup.current.rotation.y = S.yaw;

    const surfY = CUP_Y + level * sc; // world height of the liquid surface
    const sceneVis = appear > 0.05;

    // ---- streams ----------------------------------------------------
    const place = (mesh: THREE.Mesh | null, x: number, topY: number, z: number, radius: number, amt: number) => {
      if (!mesh) return;
      const len = topY - surfY;
      const on = amt > 0.02 && len > 0.02 && sceneVis;
      mesh.visible = on;
      if (!on) return;
      const wob = 1 + 0.06 * Math.sin(fs.clock.elapsedTime * 55 + topY * 9);
      mesh.position.set(x, surfY + len / 2, z);
      mesh.scale.set(radius * amt * wob, len, radius * amt * wob);
    };

    // espresso group head slides in above the cup, pulls away afterwards
    const nozPresence = smooth01(plan.esp[0] - 0.55, plan.esp[0], t) * (1 - smooth01(plan.esp[1] + 0.05, plan.esp[1] + 0.55, t));
    const nozY = NOZZLE_Y + (1 - nozPresence) * 2.0;
    if (nozzle.current) {
      nozzle.current.position.set(0, nozY, 0);
      nozzle.current.visible = nozPresence > 0.01 && sceneVis;
    }
    const espAmt = window01(t, [plan.esp[0] + 0.1, plan.esp[1]], 0.25);
    place(espStream.current, 0, nozY - NOZZLE_STREAM_DROP, 0, 0.032, espAmt);

    // milk pitcher: approach, tilt more as it empties, retreat
    const mp = prog(t, plan.milk);
    const mPresence = smooth01(0, 0.16, mp) * (1 - smooth01(0.88, 1, mp));
    const pourAmt = window01(mp, [0.18, 0.86], 0.08);
    const poured = clamp01((mp - 0.16) / 0.72);
    const theta = mPresence * (0.8 + 0.45 * poured);
    v.rest.set(3.6, 3.7, 0);
    v.tip.set(0.2, 2.25, 0).lerp(v.rest, 1 - ease(mPresence));
    if (pitcher.current) {
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const px = PITCHER_TIP.x * 0.9;
      const py = PITCHER_TIP.y * 0.9;
      pitcher.current.rotation.set(0, 0, theta);
      pitcher.current.position.set(v.tip.x - (px * c - py * s), v.tip.y - (px * s + py * c), 0);
      pitcher.current.visible = mPresence > 0.01 && sceneVis;
    }
    place(milkStream.current, v.tip.x, v.tip.y - 0.04, 0, 0.075, pourAmt);

    // syrup jug (from the left): one short pour per pump
    const sp = prog(t, plan.syr);
    const sPresence = plan.syr ? smooth01(0, 0.14, sp) * (1 - smooth01(0.9, 1, sp)) : 0;
    const dur = plan.syr ? plan.syr[1] - plan.syr[0] : 1;
    const local = Math.max(t - (plan.syr ? plan.syr[0] : 0) - 0.35, 0);
    const slotLen = 0.55;
    const inPulse = plan.syr && sPresence > 0.5 ? smooth01(0, 0.08, local % slotLen) * (1 - smooth01(0.26, 0.34, local % slotLen)) : 0;
    const sTheta = sPresence * 0.95;
    const sTip = v.sTip.set(-0.15, 2.0, 0).lerp(v.sRest.set(-3.6, 3.4, 0), 1 - ease(sPresence));
    if (bottle.current) {
      const c = Math.cos(-sTheta);
      const s = Math.sin(-sTheta);
      // mirrored jug: spout points to +x, tilts the other way
      const px = -PITCHER_TIP.x * 0.55;
      const py = PITCHER_TIP.y * 0.55;
      bottle.current.rotation.set(0, 0, -sTheta);
      bottle.current.position.set(sTip.x - (px * c - py * s), sTip.y - (px * s + py * c), 0);
      bottle.current.visible = sPresence > 0.01 && sceneVis;
    }
    const syrAmt = cfg.syrup === "None" ? 0 : inPulse * (local < dur ? 1 : 0);
    res.syrupMat.color.set(SYRUP_COLOR[cfg.syrup]);
    place(syrStream.current, sTip.x, sTip.y - 0.03, 0, 0.026, syrAmt);

    // ripple where the active stream lands
    const impact = Math.max(espAmt * 0.8, pourAmt, syrAmt * 0.6);
    if (ripple.current && rippleMat.current) {
      const rr = innerRadiusAt(level) * sc;
      const phase = (fs.clock.elapsedTime * 1.6) % 1;
      ripple.current.visible = impact > 0.05 && sceneVis;
      ripple.current.position.set(
        pourAmt > 0.05 ? v.tip.x : syrAmt > 0.05 ? sTip.x : 0,
        surfY + 0.012,
        0
      );
      const rs = (0.1 + phase * 0.35) * Math.min(rr, 1.2);
      ripple.current.scale.set(rs, rs, rs);
      rippleMat.current.opacity = (1 - phase) * 0.45 * impact;
    }

    // ---- toppings (in cup space, so they scale with the cup) -----------
    const cp = ease(prog(t, plan.cream));
    if (cream.current) {
      const pop = cp < 1 ? cp * (1 + 0.12 * Math.sin(cp * Math.PI)) : 1;
      cream.current.visible = cfg.cream && cp > 0.001;
      cream.current.scale.setScalar(Math.max(pop, 0.0001));
      cream.current.position.y = LEVEL_FINAL - 0.02;
    }
    if (drizzle.current) {
      const dp = ease(prog(t, plan.driz));
      const total = drizzleGeo.index ? drizzleGeo.index.count : 0;
      const step = 8 * 6;
      drizzle.current.visible = cfg.drizzle && dp > 0.001;
      drizzleGeo.setDrawRange(0, Math.floor((total * dp) / step) * step);
    }
    if (cinnamon.current) {
      const cpg = prog(t, plan.cin);
      cinnamon.current.visible = cfg.cinnamon && cpg > 0.001;
      const topAt = (r: number) => (cfg.cream ? LEVEL_FINAL - 0.02 + Math.max(0.5 * (1 - Math.pow(r / 0.58, 1.8)), 0) + 0.01 : LEVEL_FINAL + 0.01);
      for (let i = 0; i < CINNAMON_COUNT; i++) {
        const d = speckData[i];
        const f = clamp01((cpg - d.delay * 0.55) / 0.45);
        const r = Math.hypot(d.x, d.z);
        const landY = topAt(Math.min(r, 0.7));
        const y = landY + (1 - f * f) * 1.6;
        v.e.set(d.spin, d.spin * 2, 0);
        v.q.setFromEuler(v.e);
        v.pos.set(d.x, y, d.z);
        v.s.setScalar(d.s);
        v.a.compose(v.pos, v.q, v.s);
        cinnamon.current.setMatrixAt(i, v.a);
      }
      cinnamon.current.instanceMatrix.needsUpdate = true;
    }

    // ---- steam: faint while pouring, fuller once served ---------------
    const hot = 0.12 * smooth01(plan.milk[0], plan.milk[1], t);
    const served = smooth01(plan.serve - 0.2, plan.serve + 1.6, t);
    const steamAmt = (hot + 0.88 * served) * (sceneVis ? 1 : 0);
    const topY = CUP_Y + (cfg.cream ? LEVEL_FINAL + 0.5 : LEVEL_FINAL) * sc + 0.05;
    for (let i = 0; i < STEAM_COUNT; i++) {
      const sp2 = steam.current[i];
      if (!sp2) continue;
      const period = 3.4 + (i % 5) * 0.45;
      const life = reducedMotion ? 0.4 : (((fs.clock.elapsedTime + i * 0.97) / period) % 1 + 1) % 1;
      const ang = i * 2.4;
      const drift = Math.sin(fs.clock.elapsedTime * 0.5 + i) * 0.06 * life;
      sp2.position.set(
        Math.cos(ang) * 0.3 * sc * (0.5 + life * 0.6) + drift + Math.sin(life * 4 + i) * 0.05,
        topY + life * 1.5 * sc,
        Math.sin(ang) * 0.3 * sc * (0.5 + life * 0.6)
      );
      const size = (0.38 + life * 0.85) * sc;
      sp2.scale.set(size, size * 1.25, 1);
      const m = sp2.material as THREE.SpriteMaterial;
      m.opacity = Math.sin(life * Math.PI) * 0.34 * steamAmt;
      m.rotation = i + life * 0.8;
    }

    // contact shadow follows the cup size
    if (blob.current) {
      blob.current.scale.setScalar(5.0 * sc);
      (blob.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * ease(appear);
    }

    // ---- camera ---------------------------------------------------------
    const aspect = fs.size.width / fs.size.height;
    const dist = 11 * Math.min(1.4, Math.max(1, 0.8 / aspect));
    fs.camera.position.set(0, 7.4 + (mobile ? 0.5 : 0), dist);
    fs.camera.lookAt(0, 0.9, 0);

    // ---- report the stage (rarely changes, so React state is fine) -----
    const stage = appear > 0.5 ? stageAt(t, plan) : "Preparing";
    if (stage !== S.stage) {
      S.stage = stage;
      onStage(stage);
    }
  });

  return (
    <>
      <StudioEnvironment intensity={1} />
      <ambientLight intensity={0.12} color="#ffe9d2" />
      <directionalLight
        color="#fff0dd"
        intensity={2.4}
        position={[-3.5, 6, 4.5]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={20}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      <pointLight color="#ffc58a" intensity={8} distance={9} position={[3.5, 1.5, 3]} />

      {/* ground: soft contact shadow + a shadow catcher */}
      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={res.shadowTex} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <shadowMaterial opacity={0.4} />
      </mesh>

      {/* saucer + cup + liquid + toppings */}
      <group ref={cupGroup}>
        <Saucer />
        <CupBody />
        <Liquid state={liquid} />
        <mesh ref={cream} geometry={res.dollop} material={res.creamMat} castShadow />
        <mesh ref={drizzle} geometry={drizzleGeo} material={res.drizzleMat} />
        <instancedMesh ref={cinnamon} args={[res.speck, res.speckMat, CINNAMON_COUNT]} />
      </group>

      {/* espresso group head */}
      <group ref={nozzle}>
        <mesh geometry={res.nozzleBody} material={res.steel} castShadow />
        <mesh geometry={res.nozzleTip} material={res.steel} position={[0, NOZZLE_TIP_Y, 0]} castShadow />
      </group>

      {/* pitchers */}
      <group ref={pitcher}>
        <group scale={0.9}>
          <Pitcher material={res.steel} />
        </group>
      </group>
      <group ref={bottle}>
        <group scale={[-0.55, 0.55, 0.55]}>
          <Pitcher material={res.brass} />
        </group>
      </group>

      {/* streams: unit cylinders scaled between source and surface */}
      <mesh ref={espStream} geometry={res.stream} material={res.espressoMat} visible={false} />
      <mesh ref={milkStream} geometry={res.stream} material={res.milkMat} visible={false} />
      <mesh ref={syrStream} geometry={res.stream} material={res.syrupMat} visible={false} />
      <mesh ref={ripple} geometry={res.ripple} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <meshBasicMaterial ref={rippleMat} color="#fff6e6" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* steam */}
      <group>
        {Array.from({ length: STEAM_COUNT }, (_, i) => (
          <sprite
            key={i}
            ref={(el) => {
              steam.current[i] = el;
            }}
          >
            <spriteMaterial map={res.steamTex} transparent depthWrite={false} opacity={0} color="#fffaf2" />
          </sprite>
        ))}
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function BuilderScene({
  cfgRef,
  cream,
  replayToken,
  reducedMotion,
  mobile,
  active,
  onStage,
  onFail,
}: SceneProps & { active: boolean; onFail: () => void }) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, mobile ? 1.5 : 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 28, position: [0, 7.4, 11], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
    >
      <Scene cfgRef={cfgRef} cream={cream} replayToken={replayToken} reducedMotion={reducedMotion} mobile={mobile} onStage={onStage} />
    </Canvas>
  );
}
