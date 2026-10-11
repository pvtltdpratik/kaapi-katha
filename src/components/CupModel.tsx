"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CUP_OUTLINE,
  HANDLE_CURVE,
  SAUCER_OUTLINE,
  createSurfaceGeometry,
  innerRadiusAt,
} from "@/lib/cupGeometry";
import { buildStudioEnvironment } from "@/lib/studioEnv";

/* ------------------------------------------------------------------ */
/* Procedural textures                                                 */
/* ------------------------------------------------------------------ */

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Mottled crema: lighter at the rim, tiny bubbles throughout. */
function makeCremaTexture() {
  return canvasTexture(512, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 10, s / 2, s / 2, s / 2);
    g.addColorStop(0, "#c08f5c");
    g.addColorStop(0.55, "#b2814f");
    g.addColorStop(0.9, "#96653a");
    g.addColorStop(1, "#7c522d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * s;
      const y = rnd() * s;
      const r = 0.8 + rnd() * 2.6;
      ctx.fillStyle = rnd() > 0.5 ? "rgba(255,236,205,0.10)" : "rgba(70,36,14,0.12)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // slow swirl lines
    ctx.strokeStyle = "rgba(255,240,215,0.07)";
    ctx.lineWidth = 6;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(s / 2, s / 2, 60 + k * 55, k, k + 2.4);
      ctx.stroke();
    }
  });
}

/** Latte art: a soft rosetta-heart in microfoam, transparent background. */
function makeArtTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.save();
    ctx.translate(s / 2, s / 2);
    ctx.scale(0.58, 0.58);
    ctx.translate(-s / 2, -s / 2);
    ctx.filter = "blur(3px)";
    ctx.fillStyle = "rgba(255,248,236,0.95)";
    ctx.beginPath();
    ctx.moveTo(s / 2, s * 0.8);
    ctx.bezierCurveTo(s * 0.12, s * 0.58, s * 0.2, s * 0.22, s / 2, s * 0.36);
    ctx.bezierCurveTo(s * 0.8, s * 0.22, s * 0.88, s * 0.58, s / 2, s * 0.8);
    ctx.fill();
    // pulled rosetta lines
    ctx.strokeStyle = "rgba(196,150,100,0.55)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      const y = s * (0.42 + i * 0.09);
      ctx.beginPath();
      ctx.moveTo(s * 0.3 + i * 8, y);
      ctx.quadraticCurveTo(s / 2, y + 22, s * 0.7 - i * 8, y);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(s / 2, s * 0.36);
    ctx.lineTo(s / 2, s * 0.84);
    ctx.stroke();
    ctx.restore();
    // a thin ring of foam at the wall
    ctx.filter = "blur(5px)";
    ctx.strokeStyle = "rgba(255,245,230,0.35)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.46, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/** Syrup ribbons spiralling out from the centre. */
function makeSwirlTexture() {
  return canvasTexture(512, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.filter = "blur(3px)";
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineCap = "round";
    ctx.lineWidth = 11;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 7; a += 0.05) {
      const r = 14 + a * 11.5;
      const x = s / 2 + Math.cos(a) * r;
      const y = s / 2 + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

/** Fine noise used as a glaze micro-bump so ceramic is never perfectly flat. */
function makeGlazeBump() {
  const tex = canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, s, s);
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 5000; i++) {
      const v = 110 + Math.floor(rnd() * 36);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
    }
  });
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/* ------------------------------------------------------------------ */
/* Studio lighting environment                                         */
/* ------------------------------------------------------------------ */

export function StudioEnvironment({ intensity = 1 }: { intensity?: number }) {
  const gl = useThree((s) => s.gl);
  const get = useThree((s) => s.get);
  useEffect(() => {
    const scene = get().scene;
    const tex = buildStudioEnvironment(gl);
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    return () => {
      scene.environment = null;
      tex.dispose();
    };
  }, [gl, get, intensity]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Ceramic                                                             */
/* ------------------------------------------------------------------ */

function useCeramic() {
  const material = useMemo(() => {
    const bump = makeGlazeBump();
    const m = new THREE.MeshPhysicalMaterial({
      color: "#f7f4ee",
      roughness: 0.2,
      metalness: 0,
      ior: 1.5,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      bumpMap: bump,
      bumpScale: 0.035,
      side: THREE.DoubleSide,
    });
    return m;
  }, []);
  useEffect(
    () => () => {
      material.bumpMap?.dispose();
      material.dispose();
    },
    [material]
  );
  return material;
}

export function CupBody({ castShadow = true }: { castShadow?: boolean }) {
  const ceramic = useCeramic();
  const body = useMemo(() => new THREE.LatheGeometry(CUP_OUTLINE, 128), []);
  const handle = useMemo(() => new THREE.TubeGeometry(HANDLE_CURVE, 72, 0.072, 24, false), []);
  useEffect(
    () => () => {
      body.dispose();
      handle.dispose();
    },
    [body, handle]
  );
  return (
    <group>
      <mesh geometry={body} material={ceramic} castShadow={castShadow} receiveShadow />
      <mesh geometry={handle} material={ceramic} castShadow={castShadow} receiveShadow />
    </group>
  );
}

export function Saucer({ castShadow = true }: { castShadow?: boolean }) {
  const ceramic = useCeramic();
  const geo = useMemo(() => new THREE.LatheGeometry(SAUCER_OUTLINE, 128), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={ceramic} castShadow={castShadow} receiveShadow />;
}

/* ------------------------------------------------------------------ */
/* Liquid                                                              */
/* ------------------------------------------------------------------ */

export interface LiquidState {
  /** surface height in cup units */
  level: number;
  /** tint multiplied with the crema texture: dark = espresso, light = latte */
  tint: THREE.Color;
  /** 0..1 opacity of the latte-art layer */
  art: number;
  /** 0..1 opacity of the syrup ribbons */
  syrup: number;
  syrupColor: THREE.Color;
  /** 0..1 strength of the specular look (milk foam is duller) */
  foam: number;
}

export function makeLiquidState(): LiquidState {
  return {
    level: 1.15,
    tint: new THREE.Color("#ffffff"),
    art: 1,
    syrup: 0,
    syrupColor: new THREE.Color("#8a4b12"),
    foam: 1,
  };
}

/**
 * The liquid is a planar disc sized to the *actual* inner radius at its current
 * height, so it meets the wall with no gap and no intersection. A faint
 * meniscus curls up where it touches the ceramic.
 */
export function Liquid({ state }: { state: RefObject<LiquidState> }) {
  const geo = useMemo(() => createSurfaceGeometry(), []);
  const textures = useMemo(
    () => ({ crema: makeCremaTexture(), art: makeArtTexture(), swirl: makeSwirlTexture() }),
    []
  );

  const surface = useRef<THREE.Mesh>(null);
  const artMesh = useRef<THREE.Mesh>(null);
  const syrupMesh = useRef<THREE.Mesh>(null);
  const surfaceMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const artMat = useRef<THREE.MeshStandardMaterial>(null);
  const syrupMat = useRef<THREE.MeshPhysicalMaterial>(null);

  useEffect(
    () => () => {
      geo.dispose();
      textures.crema.dispose();
      textures.art.dispose();
      textures.swirl.dispose();
    },
    [geo, textures]
  );

  useFrame(() => {
    const st = state.current;
    if (!st) return;
    const r = innerRadiusAt(st.level) * 0.994;
    const set = (m: THREE.Mesh | null, lift: number) => {
      if (!m) return;
      m.position.y = st.level + lift;
      m.scale.set(r, 1, r);
    };
    set(surface.current, 0);
    set(artMesh.current, 0.004);
    set(syrupMesh.current, 0.007);

    if (surfaceMat.current) {
      surfaceMat.current.color.copy(st.tint);
      surfaceMat.current.roughness = 0.55 + 0.25 * (1 - st.foam);
    }
    if (artMat.current) artMat.current.opacity = st.art;
    if (syrupMat.current) {
      syrupMat.current.opacity = st.syrup;
      syrupMat.current.color.copy(st.syrupColor);
    }
  });

  return (
    <group>
      <mesh ref={surface} geometry={geo} receiveShadow>
        <meshPhysicalMaterial
          ref={surfaceMat}
          map={textures.crema}
          roughness={0.55}
          clearcoat={0.12}
          clearcoatRoughness={0.4}
          envMapIntensity={0.22}
        />
      </mesh>
      <mesh ref={artMesh} geometry={geo}>
        <meshStandardMaterial
          ref={artMat}
          map={textures.art}
          transparent
          depthWrite={false}
          roughness={0.7}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      <mesh ref={syrupMesh} geometry={geo}>
        <meshPhysicalMaterial
          ref={syrupMat}
          map={textures.swirl}
          transparent
          depthWrite={false}
          roughness={0.15}
          clearcoat={1}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>
    </group>
  );
}
