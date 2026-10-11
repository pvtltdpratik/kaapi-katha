/**
 * Tiny module-level bridge between DOM sections and the 3D cup.
 *
 * `mode` is observable (useSyncExternalStore) because the hero swaps in a static
 * fallback, and CSS hides 2D stand-ins, when WebGL is unavailable.
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
