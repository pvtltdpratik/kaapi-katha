import * as THREE from "three";

/**
 * Cup profile in cup units (height ≈ 1.45). One closed outline — foot, wall,
 * rolled rim, inner wall, floor — turned on a lathe, so the wall has real
 * thickness and the interior is visible from above.
 */

function smoothCurve(pts: [number, number][], samples: number): THREE.Vector2[] {
  const curve = new THREE.CatmullRomCurve3(
    pts.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    false,
    "centripetal"
  );
  return curve.getPoints(samples).map((p) => new THREE.Vector2(p.x, p.y));
}

// bottom centre -> up the outside
const OUTER: [number, number][] = [
  [0.0, 0.0],
  [0.4, 0.0],
  [0.47, 0.012],
  [0.5, 0.04],
  [0.5, 0.078],
  [0.57, 0.115],
  [0.7, 0.4],
  [0.86, 0.85],
  [0.96, 1.25],
  [0.985, 1.43],
];

// over the lip
const RIM: [number, number][] = [
  [0.985, 1.43],
  [0.984, 1.462],
  [0.962, 1.482],
  [0.935, 1.47],
  [0.918, 1.445],
];

// down the inside to the floor
const INNER: [number, number][] = [
  [0.918, 1.445],
  [0.885, 1.2],
  [0.82, 0.92],
  [0.72, 0.62],
  [0.56, 0.36],
  [0.34, 0.225],
  [0.0, 0.19],
];

const OUTER_PTS = smoothCurve(OUTER, 70);
const RIM_PTS = smoothCurve(RIM, 14);
const INNER_PTS = smoothCurve(INNER, 60);

export const CUP_OUTLINE: THREE.Vector2[] = [...OUTER_PTS, ...RIM_PTS.slice(1), ...INNER_PTS.slice(1)];

export const CUP_FLOOR_Y = 0.19;
export const CUP_RIM_Y = 1.445;

/** Inner wall radius at height y (cup units), so liquid can sit flush. */
export function innerRadiusAt(y: number): number {
  const pts = INNER_PTS; // descending in y
  if (y >= pts[0].y) return pts[0].x;
  for (let i = 1; i < pts.length; i++) {
    if (y >= pts[i].y) {
      const a = pts[i - 1];
      const b = pts[i];
      const t = (y - b.y) / Math.max(a.y - b.y, 1e-6);
      return b.x + (a.x - b.x) * t;
    }
  }
  return pts[pts.length - 1].x;
}

export const HANDLE_CURVE = new THREE.CatmullRomCurve3(
  [
    [0.8, 1.14, 0],
    [1.2, 1.2, 0],
    [1.5, 0.95, 0],
    [1.43, 0.58, 0],
    [0.62, 0.4, 0],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z))
);

export const SAUCER_OUTLINE: THREE.Vector2[] = smoothCurve(
  [
    [0.0, 0.0],
    [1.0, 0.0],
    [1.38, 0.012],
    [1.68, 0.12],
    [1.74, 0.175],
    [1.725, 0.19],
    [1.69, 0.18],
    [1.5, 0.11],
    [1.0, 0.075],
    [0.0, 0.07],
  ],
  60
);

/** Height of the saucer well, where the cup's foot rests. */
export const SAUCER_WELL_Y = 0.07;

/**
 * Planar-UV disc with a slight meniscus where it meets the wall. Scale it in
 * x/z by the inner radius so it always touches the cup without gaps.
 */
export function createSurfaceGeometry(radial = 96, rings = 16): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= rings; i++) {
    const r = i / rings;
    const lift = r > 0.9 ? Math.pow((r - 0.9) / 0.1, 2) * 0.03 : 0;
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      positions.push(x, lift, z);
      uvs.push(0.5 + x * 0.5, 0.5 + z * 0.5);
    }
  }
  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      // counter-clockwise seen from above so the top face is the front face
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
