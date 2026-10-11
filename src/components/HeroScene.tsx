"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { MotionValue } from "framer-motion";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

export const HOTSPOT_ANCHORS: [number, number, number][] = [
  [0.57, 1.3, 0.05], // rim of the tumbler
  [-0.12, 1.08, 0.42], // frothy surface
  [1.08, 0.28, 0.3], // brass davara lip
];

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth01 = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lathe = (pts: [number, number][], segments = 80) =>
  new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segments
  );

/* ------------------------------------------------------------------ */
/* Camera path — wide hero → leaning in → looking down into the foam   */
/* ------------------------------------------------------------------ */

const CAMERA_KEYS = [
  { q: 0, pos: [0, 0.9, 8.4], look: [0, 0.75, 0] },
  { q: 0.5, pos: [-0.9, 2.5, 5.4], look: [0, 0.95, 0] },
  { q: 1, pos: [0, 4.1, 3.7], look: [0, 0.9, 0] },
] as const;

function sampleCamera(q: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const last = CAMERA_KEYS.length - 1;
  let i = 0;
  while (i < last - 1 && q > CAMERA_KEYS[i + 1].q) i++;
  const a = CAMERA_KEYS[i];
  const b = CAMERA_KEYS[i + 1];
  const t = smooth01(0, 1, (q - a.q) / (b.q - a.q));
  pos.set(
    THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
    THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
    THREE.MathUtils.lerp(a.pos[2], b.pos[2], t)
  );
  look.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], t),
    THREE.MathUtils.lerp(a.look[1], b.look[1], t),
    THREE.MathUtils.lerp(a.look[2], b.look[2], t)
  );
}

/* ------------------------------------------------------------------ */
/* Environment — procedural studio reflections, no HDR download        */
/* ------------------------------------------------------------------ */

function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.75;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ------------------------------------------------------------------ */
/* Hero objects                                                        */
/* ------------------------------------------------------------------ */

function useFoamTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    g.addColorStop(0, "#e2b57c");
    g.addColorStop(0.55, "#b9803f");
    g.addColorStop(1, "#5c3517");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#fff4dc";
    ctx.lineWidth = 6;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(128, 128, 28 + i * 24, i, i + 3.4);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

function Tumbler() {
  const body = useMemo(
    () =>
      lathe([
        [0.0, 0.0],
        [0.4, 0.0],
        [0.425, 0.025],
        [0.44, 0.07],
        [0.5, 0.65],
        [0.555, 1.2],
        [0.585, 1.245],
        [0.58, 1.285],
        [0.55, 1.295],
        [0.525, 1.265],
        [0.52, 1.22],
        [0.465, 0.65],
        [0.4, 0.11],
        [0.0, 0.09],
      ]),
    []
  );
  const band = useMemo(
    () =>
      lathe(
        [
          [0.501, 0.62],
          [0.515, 0.64],
          [0.515, 0.7],
          [0.501, 0.72],
        ],
        80
      ),
    []
  );
  const foam = useFoamTexture();

  useEffect(
    () => () => {
      body.dispose();
      band.dispose();
      foam.dispose();
    },
    [body, band, foam]
  );

  return (
    <group position={[0, 0.06, 0]}>
      <mesh geometry={body} castShadow receiveShadow>
        <meshStandardMaterial
          color="#dcdfe3"
          metalness={1}
          roughness={0.17}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={band} castShadow>
        <meshStandardMaterial color="#c8cdd3" metalness={1} roughness={0.35} />
      </mesh>
      {/* coffee surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 1.05, 0]}>
        <circleGeometry args={[0.505, 64]} />
        <meshStandardMaterial map={foam} roughness={0.55} metalness={0} />
      </mesh>
    </group>
  );
}

function Davara() {
  const geo = useMemo(
    () =>
      lathe(
        [
          [0.0, 0.0],
          [0.84, 0.0],
          [0.9, 0.025],
          [1.04, 0.15],
          [1.12, 0.27],
          [1.145, 0.315],
          [1.115, 0.33],
          [1.07, 0.3],
          [0.96, 0.19],
          [0.82, 0.075],
          [0.0, 0.06],
        ],
        96
      ),
    []
  );
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial
        color="#c4943f"
        metalness={1}
        roughness={0.26}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Coffee beans at different depths                                    */
/* ------------------------------------------------------------------ */

interface BeanData {
  base: THREE.Vector3;
  depth: number;
  phase: number;
  speed: number;
  spin: THREE.Vector3;
  scale: number;
}

function Beans({
  count,
  pointer,
  progress,
  reducedMotion,
}: {
  count: number;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  progress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const bodyRef = useRef<THREE.InstancedMesh>(null!);
  const creaseRef = useRef<THREE.InstancedMesh>(null!);
  const smooth = useRef({ x: 0, y: 0 });

  const beans = useMemo<BeanData[]>(() => {
    const rand = mulberry32(2026);
    return Array.from({ length: count }, () => {
      const angle = rand() * Math.PI * 2;
      const radius = 1.9 + rand() * 2.8;
      const z = -3.2 + rand() * 5;
      return {
        base: new THREE.Vector3(
          Math.cos(angle) * radius,
          -0.2 + rand() * 3.4,
          Math.max(Math.sin(angle) * radius * 0.5, -3.2) + z * 0.3
        ),
        depth: (z + 3.2) / 5,
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 0.6,
        spin: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5),
        scale: 0.7 + rand() * 0.7,
      };
    });
  }, [count]);

  const tmp = useMemo(
    () => ({
      obj: new THREE.Object3D(),
      crease: new THREE.Matrix4(),
      out: new THREE.Matrix4(),
    }),
    []
  );

  useEffect(() => {
    tmp.crease.compose(
      new THREE.Vector3(0, 0.9, 0),
      new THREE.Quaternion(),
      new THREE.Vector3(0.82, 0.1, 0.16)
    );
  }, [tmp]);

  useFrame((state, dt) => {
    const k = 1 - Math.exp(-3 * dt);
    smooth.current.x += (pointer.current.x - smooth.current.x) * k;
    smooth.current.y += (pointer.current.y - smooth.current.y) * k;
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    const scroll = clamp01(progress.get() / 0.75);
    // keep the cloud over the product, away from the headline
    const wide = state.size.width / state.size.height > 1.15;
    const ox = wide ? THREE.MathUtils.lerp(1.55, 0, smooth01(0, 0.9, scroll)) : 0;

    beans.forEach((b, i) => {
      const { obj } = tmp;
      obj.position.set(
        ox + b.base.x * 0.8 - smooth.current.x * (0.15 + b.depth * 0.6),
        b.base.y +
          Math.sin(t * b.speed + b.phase) * 0.14 +
          scroll * (0.6 + b.depth * 1.8) -
          smooth.current.y * (0.1 + b.depth * 0.35) * -1,
        b.base.z + scroll * b.depth * 1.2
      );
      obj.rotation.set(
        b.phase + t * b.spin.x * 0.6,
        b.phase * 2 + t * b.spin.y * 0.6,
        t * b.spin.z * 0.6
      );
      const s = 0.1 * b.scale;
      obj.scale.set(s, s * 0.66, s * 0.74);
      obj.updateMatrix();
      bodyRef.current.setMatrixAt(i, obj.matrix);
      tmp.out.multiplyMatrices(obj.matrix, tmp.crease);
      creaseRef.current.setMatrixAt(i, tmp.out);
    });
    bodyRef.current.instanceMatrix.needsUpdate = true;
    creaseRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, count]} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
        <meshStandardMaterial color="#4a2614" roughness={0.45} metalness={0.05} />
      </instancedMesh>
      <instancedMesh ref={creaseRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#160904" roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Steam                                                               */
/* ------------------------------------------------------------------ */

function Steam({ reducedMotion }: { reducedMotion: boolean }) {
  const refs = useRef<(THREE.Sprite | null)[]>([]);
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,244,226,0.9)");
    g.addColorStop(0.5, "rgba(255,236,206,0.25)");
    g.addColorStop(1, "rgba(255,236,206,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);

  const COUNT = 6;
  useFrame((state) => {
    const t = reducedMotion ? 0 : state.clock.elapsedTime;
    for (let i = 0; i < COUNT; i++) {
      const s = refs.current[i];
      if (!s) continue;
      const life = ((t * 0.22 + i / COUNT) % 1 + 1) % 1;
      s.position.set(
        Math.sin(t * 0.7 + i * 1.9) * 0.12 * (0.4 + life) + (i % 2 ? 0.1 : -0.1),
        1.25 + life * 1.6,
        0.1
      );
      const size = 0.45 + life * 0.9;
      s.scale.set(size, size, 1);
      (s.material as THREE.SpriteMaterial).opacity = reducedMotion
        ? 0.1
        : Math.sin(life * Math.PI) * 0.22;
    }
  });

  return (
    <group>
      {Array.from({ length: COUNT }, (_, i) => (
        <sprite
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <spriteMaterial
            map={texture}
            transparent
            depthWrite={false}
            opacity={0}
            color="#fff1dc"
          />
        </sprite>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Rig: scroll camera, cursor parallax, light changes, hotspots        */
/* ------------------------------------------------------------------ */

function Rig({
  progress,
  pointer,
  hotspotRefs,
  reducedMotion,
  mobile,
}: {
  progress: MotionValue<number>;
  pointer: React.MutableRefObject<{ x: number; y: number }>;
  hotspotRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  reducedMotion: boolean;
  mobile: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const key = useRef<THREE.DirectionalLight>(null!);
  const anchors = useRef<(THREE.Object3D | null)[]>([]);
  const state = useRef({ x: 0, y: 0, q: 0 });
  const v = useMemo(
    () => ({
      pos: new THREE.Vector3(),
      look: new THREE.Vector3(),
      cur: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
    }),
    []
  );

  useFrame((fs, dt) => {
    const s = state.current;
    const t = reducedMotion ? 0 : fs.clock.elapsedTime;
    const raw = progress.get();
    const q = clamp01(raw / 0.75);

    const kp = 1 - Math.exp(-4 * dt);
    s.x += (pointer.current.x - s.x) * kp;
    s.y += (pointer.current.y - s.y) * kp;
    s.q += (q - s.q) * (1 - Math.exp(-6 * dt));

    const aspect = fs.size.width / fs.size.height;
    const wide = aspect > 1.15;

    // composition: object sits right of the headline, then drifts to centre
    const g = group.current;
    g.position.x = wide ? THREE.MathUtils.lerp(1.55, 0, smooth01(0, 0.9, s.q)) : 0;
    g.position.y = Math.sin(t * 0.9) * 0.05 - 0.15;
    g.rotation.x = s.y * 0.07 + Math.sin(t * 0.5) * 0.01;
    g.rotation.z = -s.x * 0.08;
    g.rotation.y = s.x * 0.25;

    // camera
    sampleCamera(s.q, v.pos, v.look);
    if (!wide) {
      v.pos.z *= 1.3 + (1 / Math.max(aspect, 0.4)) * 0.12;
      v.pos.y += 0.3;
    }
    v.pos.x += s.x * 0.25;
    v.pos.y += -s.y * 0.12;
    fs.camera.position.copy(v.pos);
    fs.camera.lookAt(v.look);
    fs.camera.updateMatrixWorld();

    // light: key light slides around the tumbler as you scroll
    if (key.current) {
      const a = 0.9 + s.q * 1.6;
      key.current.position.set(Math.sin(a) * 5, 4.5 - s.q * 1.2, Math.cos(a) * 5);
      key.current.intensity = 2.4 + s.q * 0.8;
    }

    // hotspots follow their 3D anchors
    const vis =
      smooth01(0.06, 0.15, raw) * (1 - smooth01(0.5, 0.62, raw));
    const w = fs.size.width;
    const h = fs.size.height;
    HOTSPOT_ANCHORS.forEach((_, i) => {
      const el = hotspotRefs.current[i];
      const a = anchors.current[i];
      if (!el || !a) return;
      a.getWorldPosition(v.tmp);
      v.tmp.project(fs.camera);
      const x = (v.tmp.x * 0.5 + 0.5) * w;
      const y = (-v.tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.opacity = vis.toFixed(3);
      el.style.pointerEvents = vis > 0.6 ? "auto" : "none";
    });
  });

  return (
    <>
      <ambientLight intensity={0.15} color="#ffe4c4" />
      <directionalLight
        ref={key}
        color="#ffb76e"
        intensity={2.4}
        position={[3, 4.5, 5]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-bias={-0.0005}
        shadow-radius={5}
      />
      <directionalLight color="#58c9a0" intensity={0.9} position={[-5, 2, -3]} />
      <pointLight color="#c4445a" intensity={14} distance={9} position={[-3.2, 0.9, 3]} />

      <group ref={group}>
        <Davara />
        <Tumbler />
        <Steam reducedMotion={reducedMotion} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
          <planeGeometry args={[14, 14]} />
          <shadowMaterial opacity={0.55} />
        </mesh>
        {HOTSPOT_ANCHORS.map((p, i) => (
          <object3D
            key={i}
            position={p}
            ref={(el) => {
              anchors.current[i] = el;
            }}
          />
        ))}
      </group>
      <Beans
        count={mobile ? 16 : 36}
        pointer={pointer}
        progress={progress}
        reducedMotion={reducedMotion}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                    */
/* ------------------------------------------------------------------ */

export interface HeroSceneProps {
  progress: MotionValue<number>;
  hotspotRefs: React.MutableRefObject<(HTMLElement | null)[]>;
  reducedMotion: boolean;
  mobile: boolean;
  active: boolean;
  onFail: () => void;
}

export default function HeroScene({
  progress,
  hotspotRefs,
  reducedMotion,
  mobile,
  active,
  onFail,
}: HeroSceneProps) {
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reducedMotion]);

  return (
    <Canvas
      shadows
      dpr={[1, mobile ? 1.5 : 1.75]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 30, position: [0, 0.9, 8.4], near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
      aria-hidden
    >
      <Environment />
      <Rig
        progress={progress}
        pointer={pointer}
        hotspotRefs={hotspotRefs}
        reducedMotion={reducedMotion}
        mobile={mobile}
      />
    </Canvas>
  );
}
