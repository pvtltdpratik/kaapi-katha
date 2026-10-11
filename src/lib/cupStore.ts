/**
 * Tiny module-level bridge between the DOM and the page-wide 3D cup.
 *
 * - `cupMode` is observable (useSyncExternalStore): the hero swaps in a static
 *   fallback, and CSS hides 2D stand-ins, when WebGL is unavailable.
 * - `cupInput` is plain mutable state read inside the render loop, so dragging
 *   the cup never triggers a React render.
 */

export type CupMode = "pending" | "webgl" | "fallback";

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

export const cupInput = {
  /** extra yaw in radians from the user's drag; springs back when released */
  yaw: 0,
  dragging: false,
  hover: false,
};
