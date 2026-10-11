import * as THREE from "three";
import type { BuilderConfig, CupSize } from "./builderConfig";

/**
 * Parametric glass cup + the layers of drink inside it.
 *
 * Everything is derived from a single `CupDims`, so the glass, the inside wall,
 * the liquid container and every layer stay coherent when the size changes.
 * Ported from the original builder's model: capacity comes from the size,
 * espresso is shots x a unit, milk is whatever remains.
 */

export interface CupDims {
  height: number;
  rTop: number;
  rBottom: number;
  /** thickness of the solid glass base (inner floor height) */
  floor: number;
  wall: number;
}

export const SIZE_DIMS: Record<CupSize, CupDims> = {
  Small: { height: 1.15, rTop: 0.8, rBottom: 0.52, floor: 0.15, wall: 0.045 },
  Regular: { height: 1.5, rTop: 0.88, rBottom: 0.56, floor: 0.16, wall: 0.045 },
  Large: { height: 1.9, rTop: 0.96, rBottom: 0.6, floor: 0.17, wall: 0.045 },
};

export const lerpDims = (a: CupDims, b: CupDims, k: number): CupDims => ({
  height: a.height + (b.height - a.height) * k,
  rTop: a.rTop + (b.rTop - a.rTop) * k,
  rBottom: a.rBottom + (b.rBottom - a.rBottom) * k,
  floor: a.floor + (b.floor - a.floor) * k,
  wall: a.wall + (b.wall - a.wall) * k,
});

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export function outerRadius(d: CupDims, y: number): number {
  const t = clamp01(y / d.height);
  return d.rBottom + (d.rTop - d.rBottom) * Math.pow(t, 0.9);
}

/** Inner wall radius at height y. The liquid always sits inside this. */
export function innerRadius(d: CupDims, y: number): number {
  const t = clamp01((y - d.floor) / (d.height - d.floor));
  const rb = d.rBottom - d.wall - 0.02;
  const rt = d.rTop - d.wall;
  return rb + (rt - rb) * Math.pow(t, 0.9);
}

/** Top of a full drink: a little below the rim, in proportion to the cup. */
export function fillTop(d: CupDims): number {
  return d.floor + (d.height - d.floor) * 0.82;
}

/** Layer boundaries, bottom to top: syrup | espresso | blend | milk | foam. */
export function stackFor(c: BuilderConfig, d: CupDims): number[] {
  const F = fillTop(d) - d.floor;
  const syrup = c.syrup === "None" ? 0 : 0.028 * c.pumps;
  const espresso = 0.1 + 0.11 * c.shots;
  const blend = 0.05;
  const foam = 0.06;
  const milk = Math.max(1 - syrup - espresso - blend - foam, 0.08);
  const parts = [syrup, espresso, blend, milk, foam];
  const sum = parts.reduce((a, b) => a + b, 0);
  const y = [d.floor];
  for (const p of parts) y.push(y[y.length - 1] + (p / sum) * F);
  return y;
}

/* ------------------------------------------------------------------ */
/* Revolved geometry updated in place (no allocation per frame)        */
/* ------------------------------------------------------------------ */

export class Revolved {
  readonly geometry: THREE.BufferGeometry;
  private readonly count: number;
  private readonly radial: number;
  private readonly pos: Float32Array;

  constructor(profilePoints: number, radial = 64) {
    this.count = profilePoints;
    this.radial = radial;
    this.pos = new Float32Array(profilePoints * radial * 3);
    const idx: number[] = [];
    for (let i = 0; i < profilePoints - 1; i++) {
      for (let j = 0; j < radial; j++) {
        const a = i * radial + j;
        const b = i * radial + ((j + 1) % radial);
        const c = (i + 1) * radial + j;
        const d = (i + 1) * radial + ((j + 1) % radial);
        idx.push(a, b, c, b, d, c);
      }
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.geometry.setIndex(idx);
  }

  /** profile: [radius, height] pairs; must have exactly `profilePoints` entries */
  update(profile: ArrayLike<readonly [number, number]>) {
    const { radial, pos } = this;
    for (let i = 0; i < this.count; i++) {
      const [r, y] = profile[i];
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        const o = (i * radial + j) * 3;
        pos[o] = Math.cos(a) * r;
        pos[o + 1] = y;
        pos[o + 2] = Math.sin(a) * r;
      }
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
    this.geometry.computeBoundingSphere();
  }

  dispose() {
    this.geometry.dispose();
  }
}

export const GLASS_POINTS = 25;

/** Foot, wall, rolled lip, inner wall and thick base as one closed outline. */
export function glassProfile(d: CupDims): [number, number][] {
  const p: [number, number][] = [
    [0, 0],
    [d.rBottom * 0.82, 0],
    [d.rBottom * 0.96, 0.025],
  ];
  for (let i = 0; i <= 8; i++) {
    const y = 0.06 + ((d.height - 0.06) * i) / 8;
    p.push([outerRadius(d, y), y]);
  }
  p.push([d.rTop - d.wall * 0.15, d.height + 0.014]);
  p.push([d.rTop - d.wall * 0.85, d.height + 0.014]);
  p.push([innerRadius(d, d.height), d.height]);
  for (let i = 1; i <= 8; i++) {
    const y = d.height - ((d.height - d.floor) * i) / 8;
    p.push([innerRadius(d, y), y]);
  }
  p.push([innerRadius(d, d.floor) * 0.85, d.floor + 0.012]);
  p.push([0, d.floor]);
  return p;
}

export const LAYER_POINTS = 14;

/** A solid slab of liquid between y0 and y1 that follows the inner wall. */
export function layerProfile(d: CupDims, y0: number, y1: number): [number, number][] {
  const inset = 0.006;
  const p: [number, number][] = [[0, y0]];
  const wallPts = LAYER_POINTS - 2;
  for (let i = 0; i < wallPts; i++) {
    const y = y0 + ((y1 - y0) * i) / (wallPts - 1);
    p.push([Math.max(innerRadius(d, y) - inset, 0.001), y]);
  }
  p.push([0, y1]);
  return p;
}
