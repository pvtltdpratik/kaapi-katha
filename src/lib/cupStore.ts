/**
 * Tiny module-level bridge between DOM sections and the 3D cup.
 *
 * - `cupParams` is mutable and read inside the render loop, so changing it never
 *   triggers a React render.
 * - `mode` is observable (useSyncExternalStore) because the hero and customizer
 *   swap in static fallbacks when WebGL is unavailable.
 */

export type CupMode = "pending" | "webgl" | "fallback";

export const cupParams = {
  /** multiplier applied while the cup sits in the customizer slot */
  sizeScale: 1,
  /** 0 = black coffee, 1 = very milky */
  milk: 0.45,
};

let mode: CupMode = "pending";
const listeners = new Set<() => void>();

export const cupMode = {
  get: () => mode,
  set(next: CupMode) {
    if (next === mode) return;
    mode = next;
    if (typeof document !== "undefined") {
      document.documentElement.dataset.cupStage = next;
    }
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
