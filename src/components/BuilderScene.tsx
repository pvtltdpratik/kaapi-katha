"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Saucer, StudioEnvironment } from "./CupModel";
import { SAUCER_WELL_Y } from "@/lib/cupGeometry";
import {
  GLASS_POINTS,
  LAYER_POINTS,
  Revolved,
  SIZE_DIMS,
  glassProfile,
  innerRadius,
  layerProfile,
  lerpDims,
  outerRadius,
  stackFor,
  type CupDims,
} from "@/lib/glassCup";
import { configKey, type BuilderConfig, type MilkType, type SyrupType } from "@/lib/builderConfig";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const BASE_Y = SAUCER_WELL_Y; // glass foot rests in the saucer well
const NOZZLE_Y = 3.3;
const NOZZLE_TIP_Y = -0.36;
const NOZZLE_STREAM_DROP = 0.49;
const DEFAULT_YAW = 0.5;
const DEFAULT_PITCH = 0.36;
const PITCH_MIN = 0.12;
const PITCH_MAX = 1.0;

const MILK_COLOR: Record<MilkType, string> = {
  "Whole Milk": "#f4e8d2", // natural cream
  "Oat Milk": "#e3cfa6", // warm beige
  "Almond Milk": "#ecdcc0", // light, slightly nutty
  "Coconut Milk": "#f7f2e8", // clean off-white
};
const SYRUP_COLOR: Record<SyrupType, string> = {
  None: "#000000",
  Jaggery: "#a85a14",
  Cardamom: "#b8a24a",
  Rose: "#d8708f",
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth01 = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => t * t * (3 - 2 * t);
type Range = [number, number];
const prog = (t: number, r: Range | null) => (r ? clamp01((t - r[0]) / (r[1] - r[0])) : 0);
const window01 = (t: number, r: Range | null, fade = 0.18) =>
  r ? smooth01(r[0], r[0] + fade, t) * (1 - smooth01(r[1] - fade, r[1], t)) : 0;

/* ------------------------------------------------------------------ */
/* Preparation plan (built from the *current* configuration)           */
/* ------------------------------------------------------------------ */

interface Plan {
  syr: Range | null;
  esp: Range;
  milk: Range;
  cream: Range | null;
  driz: Range | null;
  cin: Range | null;
  serve: number;
  total: number;
  firstTopping: number | null;
}

function buildPlan(c: BuilderConfig): Plan {
  let t = 0.6;
  let syr: Range | null = null;
  if (c.syrup !== "None") {
    syr = [t, t + 0.5 + c.pumps * 0.5];
    t = syr[1] + 0.35;
  }
  const esp: Range = [t, t + 1.0 + 0.7 * c.shots];
  t = esp[1] + 0.4;
  const milk: Range = [t, t + 2.8];
  t = milk[1] + 0.4;
  const firstTopping = c.cream || c.drizzle || c.cinnamon ? t : null;
  let cream: Range | null = null;
  let driz: Range | null = null;
  let cin: Range | null = null;
  if (c.cream) {
    cream = [t, t + 1.0];
    t = cream[1] + 0.25;
  }
  if (c.drizzle) {
    driz = [t, t + 1.3];
    t = driz[1] + 0.25;
  }
  if (c.cinnamon) {
    cin = [t, t + 1.4];
    t = cin[1] + 0.25;
  }
  return { syr, esp, milk, cream, driz, cin, serve: t + 0.1, total: t + 2.0, firstTopping };
}

function stageAt(t: number, p: Plan): string {
  if (t >= p.serve) return "Served";
  if (p.firstTopping !== null && t >= p.firstTopping) return "Toppings";
  if (t >= p.milk[0]) return "Milk";
  if (t >= p.esp[0]) return "Espresso";
  if (p.syr && t >= p.syr[0]) return "Syrup";
  return "Preparing";
}

/* ------------------------------------------------------------------ */
/* Props and small parts                                               */
/* ------------------------------------------------------------------ */

export interface BuilderSceneProps {
  cfgRef: RefObject<BuilderConfig>;
  cream: boolean;
  replayToken: number;
  resetToken: number;
  zoomed: boolean;
  reducedMotion: boolean;
  mobile: boolean;
  onStage: (stage: string) => void;
}

const PITCHER_TIP = new THREE.Vector3(-0.64, 0.9, 0);

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
      <mesh geometry={body} material={material} />
      <mesh geometry={handle} material={material} position={[0.46, 0.46, 0]} rotation={[0, 0, -Math.PI / 2]} />
      <mesh geometry={spout} material={material} position={[-0.52, 0.86, 0]} rotation={[0, 0, Math.PI / 2 + 0.35]} />
    </group>
  );
}

function softTexture(kind: "steam" | "shadow") {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  if (kind === "shadow") {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,0.7)");
    g.addColorStop(0.55, "rgba(0,0,0,0.26)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  } else {
    for (let i = 0; i < 26; i++) {
      const h = (n: number) => {
        const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
        return x - Math.floor(x);
      };
      const x = 64 + (h(i * 3 + 1) - 0.5) * 60;
      const y = 64 + (h(i * 3 + 2) - 0.5) * 70;
      const r = 10 + h(i * 3 + 3) * 22;
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

const STEAM_COUNT = 12;
const CINNAMON_COUNT = 70;
const LAYERS = 5; // syrup, espresso, blend, milk, foam

function Scene({
  cfgRef,
  cream: withCream,
  replayToken,
  resetToken,
  zoomed,
  reducedMotion,
  mobile,
  onStage,
}: BuilderSceneProps) {
  const gl = useThree((s) => s.gl);

  // animated objects
  const cupGroup = useRef<THREE.Group>(null);
  const handleGroup = useRef<THREE.Group>(null);
  const saucerGroup = useRef<THREE.Group>(null);
  const nozzle = useRef<THREE.Group>(null);
  const pitcher = useRef<THREE.Group>(null);
  const jug = useRef<THREE.Group>(null);
  const espStream = useRef<THREE.Mesh>(null);
  const milkStream = useRef<THREE.Mesh>(null);
  const syrStream = useRef<THREE.Mesh>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const rippleMat = useRef<THREE.MeshBasicMaterial>(null);
  const creamMesh = useRef<THREE.Mesh>(null);
  const drizzleMesh = useRef<THREE.Mesh>(null);
  const cinnamon = useRef<THREE.InstancedMesh>(null);
  const steam = useRef<(THREE.Sprite | null)[]>([]);
  const blob = useRef<THREE.Mesh>(null);
  const layerMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const layerMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);

  // geometry that is rewritten in place every frame
  const [rig] = useState(() => ({
    glass: new Revolved(GLASS_POINTS, 96),
    layers: Array.from({ length: LAYERS }, () => new Revolved(LAYER_POINTS, 64)),
  }));
  useEffect(
    () => () => {
      rig.glass.dispose();
      rig.layers.forEach((l) => l.dispose());
    },
    [rig]
  );

  const sim = useRef({
    t: 0,
    started: false,
    played: false,
    key: "",
    plan: null as Plan | null,
    stage: "",
    dims: { ...SIZE_DIMS.Regular } as CupDims,
    yaw: DEFAULT_YAW,
    yawVel: 0,
    pitch: DEFAULT_PITCH,
    zoom: 1,
    hover: 0,
    hovering: false,
    drag: false,
    lastX: 0,
    lastY: 0,
    pointers: new Map<number, { x: number; y: number }>(),
    pinchStart: 0,
    zoomStart: 1,
    zoomTarget: 1,
    resetting: false,
    initialised: false,
  });

  const res = useMemo(() => {
    const steel = new THREE.MeshStandardMaterial({ color: "#d6d9dd", metalness: 1, roughness: 0.22, side: THREE.DoubleSide });
    const brass = new THREE.MeshStandardMaterial({ color: "#c9962f", metalness: 1, roughness: 0.3, side: THREE.DoubleSide });
    const stream = (color: string, rough: number) =>
      new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.08, transparent: true, opacity: 0.96 });
    return {
      steel,
      brass,
      espressoStream: stream("#2a1307", 0.12),
      milkStream: stream("#f6efe3", 0.3),
      syrupStream: stream("#a85a14", 0.1),
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
      handle: new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(
          [
            [-0.08, 0.36, 0],
            [0.32, 0.4, 0],
            [0.56, 0.06, 0],
            [0.38, -0.28, 0],
            [-0.08, -0.34, 0],
          ].map(([x, y, z]) => new THREE.Vector3(x, y, z))
        ),
        48,
        0.058,
        16,
        false
      ),
      speck: new THREE.SphereGeometry(0.016, 6, 5),
      steamTex: softTexture("steam"),
      shadowTex: softTexture("shadow"),
      creamMat: new THREE.MeshPhysicalMaterial({ color: "#fbf7ee", roughness: 0.55, clearcoat: 0.25 }),
      drizzleMat: new THREE.MeshPhysicalMaterial({ color: "#8a4a10", roughness: 0.12, clearcoat: 1 }),
      speckMat: new THREE.MeshStandardMaterial({ color: "#6a3a1b", roughness: 0.9 }),
    };
  }, []);

  useEffect(
    () => () => {
      Object.values(res).forEach((v) => {
        const d = v as { dispose?: () => void };
        if (d && typeof d.dispose === "function") d.dispose();
      });
    },
    [res]
  );

  // drizzle path: relative to the surface, scaled to the cup at draw time
  const drizzleGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 140; i++) {
      const u = i / 140;
      const a = u * Math.PI * 2 * 2.6;
      const r = 0.04 + u * (withCream ? 0.42 : 0.6);
      const dome = withCream ? 0.5 * (1 - Math.pow(r / 0.58, 1.8)) + 0.02 : 0.012;
      pts.push(new THREE.Vector3(Math.cos(a) * r, dome, Math.sin(a) * r));
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

  const scratch = useRef({
    tip: new THREE.Vector3(),
    rest: new THREE.Vector3(),
    jTip: new THREE.Vector3(),
    jRest: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    s: new THREE.Vector3(),
    e: new THREE.Euler(),
    m: new THREE.Matrix4(),
    c1: new THREE.Color(),
    c2: new THREE.Color(),
    c3: new THREE.Color(),
  });

  // Replay: run the sequence again with whatever is selected right now
  useEffect(() => {
    if (replayToken === 0) return;
    sim.current.t = 0;
    sim.current.started = true;
    sim.current.played = false;
  }, [replayToken]);

  // Reset view
  useEffect(() => {
    if (resetToken === 0) return;
    sim.current.resetting = true;
  }, [resetToken]);

  useEffect(() => {
    sim.current.zoomTarget = zoomed ? 0.62 : 1;
  }, [zoomed]);

  // pointer input: drag to turn / tilt, pinch to zoom, hover feedback
  useEffect(() => {
    const el = gl.domElement;
    const S = sim.current;
    const down = (e: PointerEvent) => {
      S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
      S.resetting = false;
      if (S.pointers.size === 1) {
        S.drag = true;
        S.lastX = e.clientX;
        S.lastY = e.clientY;
      } else if (S.pointers.size === 2) {
        const [a, b] = [...S.pointers.values()];
        S.pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        S.zoomStart = S.zoomTarget;
        S.drag = false;
      }
    };
    const move = (e: PointerEvent) => {
      if (S.pointers.has(e.pointerId)) S.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (S.pointers.size === 2) {
        const [a, b] = [...S.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (S.pinchStart > 0) S.zoomTarget = Math.min(1.15, Math.max(0.55, S.zoomStart * (S.pinchStart / d)));
        return;
      }
      if (!S.drag) return;
      const dx = e.clientX - S.lastX;
      const dy = e.clientY - S.lastY;
      S.lastX = e.clientX;
      S.lastY = e.clientY;
      S.yaw += dx * 0.011;
      S.yawVel = dx * 0.011;
      S.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, S.pitch + dy * 0.006));
    };
    const up = (e: PointerEvent) => {
      S.pointers.delete(e.pointerId);
      if (S.pointers.size === 0) S.drag = false;
    };
    const enter = () => {
      S.hovering = true;
    };
    const leave = () => {
      S.hovering = false;
    };
    const dbl = () => {
      S.zoomTarget = S.zoomTarget < 0.9 ? 1 : 0.62;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("dblclick", dbl);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("dblclick", dbl);
    };
  }, [gl]);

  useFrame((fs, dt) => {
    const cfg = cfgRef.current;
    const v = scratch.current;
    const S = sim.current;
    if (!cfg || !cupGroup.current) return;
    const step = Math.min(dt, 0.05);

    // --- plan follows the live configuration -----------------------------
    const key = configKey(cfg);
    if (key !== S.key || !S.plan) {
      const firstTime = !S.plan;
      S.key = key;
      S.plan = buildPlan(cfg);
      // A change never restarts a "regular coffee" preview: if the drink had
      // started or finished, show the *new* drink finished, immediately.
      if (!firstTime && (S.started || S.played)) S.t = S.plan.total;
      else S.t = 0;
    }
    const plan = S.plan;

    // --- hand-off with the page-wide cup ------------------------------
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
      S.played = false;
    } else if (appear > 0.9 && !S.started && !S.played) {
      S.started = true; // first time in view: make the current drink once
    }
    if (reducedMotion) {
      S.t = plan.total;
      S.played = true;
    } else if (S.started) {
      S.t = Math.min(S.t + step, plan.total);
      if (S.t >= plan.total) {
        S.started = false;
        S.played = true;
      }
    }
    const t = S.played || reducedMotion ? plan.total : S.t;

    // --- geometry: cup dimensions follow the selected size -----------------
    const target = SIZE_DIMS[cfg.size];
    const k = reducedMotion ? 1 : 1 - Math.exp(-9 * step);
    S.dims = lerpDims(S.dims, target, k);
    const d = S.dims;
    rig.glass.update(glassProfile(d));

    const y = stackFor(cfg, d); // y0..y5
    const syrP = plan.syr ? ease(prog(t, plan.syr)) : 1;
    const espP = ease(prog(t, plan.esp));
    const milkP = ease(prog(t, plan.milk));
    const finished = t >= plan.milk[1];
    let h = y[0] + (y[1] - y[0]) * syrP + (y[2] - y[1]) * espP + (y[5] - y[2]) * milkP;
    if (finished) h = y[5];

    // colours that depend on the selection
    const shotsT = (cfg.shots - 1) / 3;
    v.c1.set("#4b2a15").lerp(v.c2.set("#1b0d06"), shotsT); // espresso: darker, richer with more shots
    const milkC = v.c3.set(MILK_COLOR[cfg.milk]);
    const colours: THREE.Color[] = [
      new THREE.Color(SYRUP_COLOR[cfg.syrup]),
      v.c1.clone(),
      v.c1.clone().lerp(milkC, 0.5),
      milkC.clone(),
      milkC.clone().lerp(new THREE.Color("#ffffff"), 0.35),
    ];
    for (let i = 0; i < LAYERS; i++) {
      const lo = y[i];
      const hi = y[i + 1];
      const top = Math.min(Math.max(h, lo), hi);
      const mesh = layerMeshes.current[i];
      const mat = layerMats.current[i];
      if (mesh) mesh.visible = top - lo > 0.004 && appear > 0.02;
      rig.layers[i].update(layerProfile(d, lo, Math.max(top, lo + 0.0005)));
      if (mat) mat.color.copy(colours[i]);
    }

    // handle sits on the wall and scales with the cup
    if (handleGroup.current) {
      const my = d.height * 0.5;
      handleGroup.current.position.set(outerRadius(d, my) - 0.03, my, 0);
      handleGroup.current.scale.set(1, d.height / 1.5, 1);
    }

    // --- interaction state ------------------------------------------------
    if (!S.drag) {
      S.yaw += S.yawVel;
      S.yawVel *= Math.exp(-5 * step);
    }
    if (S.resetting) {
      const kk = 1 - Math.exp(-6 * step);
      S.yaw += (DEFAULT_YAW - S.yaw) * kk;
      S.pitch += (DEFAULT_PITCH - S.pitch) * kk;
      S.zoomTarget += (1 - S.zoomTarget) * kk;
      if (Math.abs(S.yaw - DEFAULT_YAW) < 0.01 && Math.abs(S.pitch - DEFAULT_PITCH) < 0.01) S.resetting = false;
    }
    S.zoom += (S.zoomTarget - S.zoom) * (1 - Math.exp(-8 * step));
    S.hover += ((S.hovering && !S.drag ? 1 : 0) - S.hover) * (1 - Math.exp(-8 * step));

    // --- appearance of the whole assembly -------------------------------
    const sc = Math.max((0.4 + 0.6 * ease(appear)) * (1 + 0.02 * S.hover), 0.0001);
    cupGroup.current.visible = appear > 0.02;
    cupGroup.current.scale.setScalar(sc);
    cupGroup.current.position.y = BASE_Y;
    cupGroup.current.rotation.y = S.yaw;
    if (saucerGroup.current) {
      saucerGroup.current.visible = appear > 0.02;
      saucerGroup.current.scale.setScalar(sc);
    }
    const sceneVis = appear > 0.05;
    const surfY = BASE_Y + h * sc;

    // --- streams ----------------------------------------------------------
    const place = (mesh: THREE.Mesh | null, x: number, topY: number, radius: number, amt: number) => {
      if (!mesh) return;
      const len = topY - surfY;
      const on = amt > 0.02 && len > 0.02 && sceneVis;
      mesh.visible = on;
      if (!on) return;
      const wob = 1 + 0.06 * Math.sin(fs.clock.elapsedTime * 55 + topY * 9);
      mesh.position.set(x, surfY + len / 2, 0);
      mesh.scale.set(radius * amt * wob, len, radius * amt * wob);
    };
    const rimTop = BASE_Y + (d.height + 0.55) * sc;

    // syrup jug (from the left), one pulse per pump, pours first: it sits at the bottom
    const sp = prog(t, plan.syr);
    const sPresence = plan.syr && !finished ? smooth01(0, 0.14, sp) * (1 - smooth01(0.9, 1, sp)) : 0;
    const dur = plan.syr ? plan.syr[1] - plan.syr[0] : 1;
    const local = Math.max(t - (plan.syr ? plan.syr[0] : 0) - 0.3, 0);
    const slotLen = 0.5;
    const inPulse =
      plan.syr && sPresence > 0.5 && local < dur - 0.2
        ? smooth01(0, 0.07, local % slotLen) * (1 - smooth01(0.24, 0.32, local % slotLen))
        : 0;
    const jugTheta = sPresence * 0.95;
    const jugTipY = Math.max(2.1, rimTop);
    v.jTip.set(-0.15, jugTipY, 0).lerp(v.jRest.set(-3.7, jugTipY + 1.2, 0), 1 - ease(sPresence));
    if (jug.current) {
      const c = Math.cos(-jugTheta);
      const s = Math.sin(-jugTheta);
      const px = -PITCHER_TIP.x * 0.55;
      const py = PITCHER_TIP.y * 0.55;
      jug.current.rotation.set(0, 0, -jugTheta);
      jug.current.position.set(v.jTip.x - (px * c - py * s), v.jTip.y - (px * s + py * c), 0);
      jug.current.visible = sPresence > 0.01 && sceneVis;
    }
    res.syrupStream.color.set(SYRUP_COLOR[cfg.syrup]);
    place(syrStream.current, v.jTip.x, v.jTip.y - 0.03, 0.026, cfg.syrup === "None" ? 0 : inPulse);

    // espresso group head
    const nozPresence =
      smooth01(plan.esp[0] - 0.55, plan.esp[0], t) * (1 - smooth01(plan.esp[1] + 0.05, plan.esp[1] + 0.55, t)) * (finished ? 0 : 1);
    const nozY = NOZZLE_Y + (1 - nozPresence) * 2.0;
    if (nozzle.current) {
      nozzle.current.position.set(0, nozY, 0);
      nozzle.current.visible = nozPresence > 0.01 && sceneVis;
    }
    place(espStream.current, 0, nozY - NOZZLE_STREAM_DROP, 0.032, window01(t, [plan.esp[0] + 0.1, plan.esp[1]], 0.25));

    // milk pitcher
    const mp = prog(t, plan.milk);
    const mPresence = finished ? 0 : smooth01(0, 0.16, mp) * (1 - smooth01(0.88, 1, mp)) * (t >= plan.milk[0] ? 1 : 0);
    const pourAmt = window01(mp, [0.18, 0.86], 0.08) * (finished ? 0 : 1);
    const theta = mPresence * (0.8 + 0.45 * clamp01((mp - 0.16) / 0.72));
    const pitchTipY = Math.max(2.25, rimTop);
    v.tip.set(0.2, pitchTipY, 0).lerp(v.rest.set(3.7, pitchTipY + 1.3, 0), 1 - ease(mPresence));
    if (pitcher.current) {
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      const px = PITCHER_TIP.x * 0.9;
      const py = PITCHER_TIP.y * 0.9;
      pitcher.current.rotation.set(0, 0, theta);
      pitcher.current.position.set(v.tip.x - (px * c - py * s), v.tip.y - (px * s + py * c), 0);
      pitcher.current.visible = mPresence > 0.01 && sceneVis;
    }
    res.milkStream.color.set(MILK_COLOR[cfg.milk]);
    place(milkStream.current, v.tip.x, v.tip.y - 0.04, 0.075, pourAmt);

    // ripple where the active stream lands
    const impact = Math.max(window01(t, [plan.esp[0] + 0.1, plan.esp[1]], 0.25) * 0.8, pourAmt, inPulse * 0.6);
    if (ripple.current && rippleMat.current) {
      const rr = innerRadius(d, Math.max(h, d.floor + 0.05)) * sc;
      const ph = (fs.clock.elapsedTime * 1.6) % 1;
      ripple.current.visible = impact > 0.05 && sceneVis;
      ripple.current.position.set(pourAmt > 0.05 ? v.tip.x : inPulse > 0.05 ? v.jTip.x : 0, surfY + 0.012, 0);
      const rs = (0.1 + ph * 0.35) * Math.min(rr, 1.2);
      ripple.current.scale.set(rs, rs, rs);
      rippleMat.current.opacity = (1 - ph) * 0.45 * impact;
    }

    // --- toppings, sitting on the real surface of the finished drink -------
    const f = innerRadius(d, y[5]) / 0.88; // topping scale follows the cup's width
    const cp = ease(prog(t, plan.cream));
    if (creamMesh.current) {
      const pop = cp < 1 ? cp * (1 + 0.12 * Math.sin(cp * Math.PI)) : 1;
      creamMesh.current.visible = cfg.cream && cp > 0.001;
      creamMesh.current.scale.setScalar(Math.max(pop * f, 0.0001));
      creamMesh.current.position.y = y[5] - 0.02;
    }
    if (drizzleMesh.current) {
      const dp = ease(prog(t, plan.driz));
      const total = drizzleGeo.index ? drizzleGeo.index.count : 0;
      const stp = 8 * 6;
      drizzleMesh.current.visible = cfg.drizzle && dp > 0.001;
      drizzleMesh.current.scale.set(f, f, f);
      drizzleMesh.current.position.y = y[5] - 0.02 * (cfg.cream ? 1 : 0) + 0.004;
      drizzleGeo.setDrawRange(0, Math.floor((total * dp) / stp) * stp);
    }
    if (cinnamon.current) {
      const cpg = prog(t, plan.cin);
      cinnamon.current.visible = cfg.cinnamon && cpg > 0.001;
      const topAt = (r: number) => (cfg.cream ? (Math.max(0.5 * (1 - Math.pow(r / 0.58, 1.8)), 0) - 0.02) * f : 0) + y[5] + 0.012;
      for (let i = 0; i < CINNAMON_COUNT; i++) {
        const dd = speckData[i];
        const fall = clamp01((cpg - dd.delay * 0.55) / 0.45);
        const r = Math.hypot(dd.x, dd.z);
        const landY = topAt(Math.min(r, 0.7));
        v.e.set(dd.spin, dd.spin * 2, 0);
        v.q.setFromEuler(v.e);
        v.pos.set(dd.x * f, landY + (1 - fall * fall) * 1.6, dd.z * f);
        v.s.setScalar(dd.s);
        v.m.compose(v.pos, v.q, v.s);
        cinnamon.current.setMatrixAt(i, v.m);
      }
      cinnamon.current.instanceMatrix.needsUpdate = true;
    }

    // --- steam: only a trace while pouring, fuller once served --------------
    const served = smooth01(plan.serve - 0.2, plan.serve + 1.6, t);
    const steamAmt = ((0.1 * smooth01(plan.milk[0], plan.milk[1], t)) + 0.9 * served) * (sceneVis ? 1 : 0);
    const topY = BASE_Y + (y[5] + (cfg.cream ? 0.5 * f : 0)) * sc + 0.05;
    for (let i = 0; i < STEAM_COUNT; i++) {
      const sp2 = steam.current[i];
      if (!sp2) continue;
      const period = 3.4 + (i % 5) * 0.45;
      const life = reducedMotion ? 0.4 : (((fs.clock.elapsedTime + i * 0.97) / period) % 1 + 1) % 1;
      const ang = i * 2.4;
      const spread = innerRadius(d, y[5]) * 0.35 * sc;
      sp2.position.set(
        Math.cos(ang) * spread * (0.5 + life * 0.6) + Math.sin(fs.clock.elapsedTime * 0.5 + i) * 0.05 * life,
        topY + life * 1.5 * sc,
        Math.sin(ang) * spread * (0.5 + life * 0.6)
      );
      const size = (0.38 + life * 0.85) * sc;
      sp2.scale.set(size, size * 1.25, 1);
      const m = sp2.material as THREE.SpriteMaterial;
      m.opacity = Math.sin(life * Math.PI) * 0.34 * steamAmt;
      m.rotation = i + life * 0.8;
    }

    if (blob.current) {
      blob.current.scale.setScalar(5.0 * sc);
      (blob.current.material as THREE.MeshBasicMaterial).opacity = 0.9 * ease(appear);
    }

    // --- camera: orbit with pitch limits, zoom ---------------------------------
    const aspect = fs.size.width / fs.size.height;
    const dist = 11 * Math.min(1.4, Math.max(1, 0.8 / aspect)) * S.zoom;
    const targetY = 1.0 + (d.height - 1.5) * 0.4;
    fs.camera.position.set(0, targetY + Math.sin(S.pitch) * dist + (mobile ? 0.3 : 0), Math.cos(S.pitch) * dist);
    fs.camera.lookAt(0, targetY, 0);

    // --- stage label ----------------------------------------------------------
    const stage = appear > 0.5 ? (S.played && !S.started ? "Served" : stageAt(t, plan)) : "Preparing";
    if (stage !== S.stage) {
      S.stage = stage;
      onStage(stage);
    }
  });

  const glassMat = (
    <meshPhysicalMaterial
      color="#ffffff"
      transmission={0.96}
      thickness={0.04}
      ior={1.12}
      roughness={0.03}
      clearcoat={0.35}
      clearcoatRoughness={0.05}
      attenuationColor="#fff6e8"
      attenuationDistance={9}
      envMapIntensity={0.45}
      specularIntensity={1}
      side={THREE.DoubleSide}
    />
  );

  return (
    <>
      <StudioEnvironment intensity={1.1} />
      <ambientLight intensity={0.15} color="#ffe9d2" />
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
      />
      <pointLight color="#ffc58a" intensity={8} distance={9} position={[3.5, 1.5, 3]} />

      <mesh ref={blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={res.shadowTex} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <shadowMaterial opacity={0.35} />
      </mesh>

      <group ref={saucerGroup}>
        <Saucer />
      </group>

      {/* the cup: glass, liquid layers and toppings all share one coordinate space */}
      <group ref={cupGroup}>
        {rig.layers.map((layer, i) => (
          <mesh
            key={i}
            ref={(el) => {
              layerMeshes.current[i] = el;
            }}
            geometry={layer.geometry}
            frustumCulled={false}
          >
            <meshPhysicalMaterial
              ref={(el) => {
                layerMats.current[i] = el;
              }}
              roughness={i === 4 ? 0.65 : i === 3 ? 0.42 : 0.2}
              clearcoat={i === 1 ? 0.5 : 0.1}
              clearcoatRoughness={0.2}
            />
          </mesh>
        ))}

        <mesh geometry={rig.glass.geometry} frustumCulled={false}>
          {glassMat}
        </mesh>
        <group ref={handleGroup}>
          <mesh geometry={res.handle}>{glassMat}</mesh>
        </group>

        <mesh ref={creamMesh} geometry={res.dollop} material={res.creamMat} castShadow />
        <mesh ref={drizzleMesh} geometry={drizzleGeo} material={res.drizzleMat} />
        <instancedMesh ref={cinnamon} args={[res.speck, res.speckMat, CINNAMON_COUNT]} frustumCulled={false} />
      </group>

      {/* espresso group head */}
      <group ref={nozzle}>
        <mesh geometry={res.nozzleBody} material={res.steel} />
        <mesh geometry={res.nozzleTip} material={res.steel} position={[0, NOZZLE_TIP_Y, 0]} />
      </group>

      {/* milk pitcher */}
      <group ref={pitcher}>
        <group scale={0.9}>
          <Pitcher material={res.steel} />
        </group>
      </group>

      {/* syrup jug, mirrored so it pours in from the left */}
      <group ref={jug}>
        <group scale={[-0.55, 0.55, 0.55]}>
          <Pitcher material={res.brass} />
        </group>
      </group>

      <mesh ref={espStream} geometry={res.stream} material={res.espressoStream} visible={false} />
      <mesh ref={milkStream} geometry={res.stream} material={res.milkStream} visible={false} />
      <mesh ref={syrStream} geometry={res.stream} material={res.syrupStream} visible={false} />
      <mesh ref={ripple} geometry={res.ripple} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <meshBasicMaterial ref={rippleMat} color="#fff6e6" transparent opacity={0} depthWrite={false} />
      </mesh>

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
  active,
  onFail,
  ...props
}: BuilderSceneProps & { active: boolean; onFail: () => void }) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={[1, props.mobile ? 1.5 : 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 28, position: [0, 6, 11], near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
