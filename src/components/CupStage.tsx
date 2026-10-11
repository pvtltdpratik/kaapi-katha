"use client";

import {
  Component,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { cupMode } from "@/lib/cupStore";

const CupScene = dynamic(() => import("./CupScene"), { ssr: false });

// Side lanes only exist from the lg breakpoint up; below it the cup follows
// a simpler path (hero -> customizer preview).
const COMPACT_QUERY = "(max-width: 1023px)";

function useIsCompact() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(COMPACT_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(COMPACT_QUERY).matches,
    () => false
  );
}

function detectWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class Boundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * One fixed, click-through canvas for the whole page. The cup inside it is
 * driven by window scroll position (see CupScene), so it travels with the
 * reader instead of belonging to any single section.
 */
export default function CupStage() {
  const mode = useSyncExternalStore(cupMode.subscribe, cupMode.get, () => "pending" as const);
  const compact = useIsCompact();
  const reduced = !!useReducedMotion();

  useEffect(() => {
    cupMode.set(detectWebGL() ? "webgl" : "fallback");
  }, []);

  if (mode !== "webgl") return null;

  return (
    <div className="cup-stage fixed inset-0 z-20 pointer-events-none" aria-hidden>
      <Boundary onError={() => cupMode.set("fallback")}>
        <CupScene
          mobile={compact}
          reducedMotion={reduced}
          onFail={() => cupMode.set("fallback")}
        />
      </Boundary>
    </div>
  );
}
