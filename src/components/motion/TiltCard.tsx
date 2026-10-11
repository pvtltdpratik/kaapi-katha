"use client";

import { useRef, type ReactNode } from "react";

/**
 * A small hover tilt (in the spirit of ReactBits' TiltedCard): the element
 * leans a few degrees toward the pointer and settles back on leave. Fine
 * pointers only, and never under reduced motion. It only ever sets a
 * transform, so it cannot change layout or capture clicks.
 */
export default function TiltCard({
  children,
  className = "",
  max = 7,
  lift = 1.03,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  lift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef<boolean | null>(null);

  const canTilt = () => {
    if (enabled.current === null) {
      enabled.current =
        window.matchMedia("(pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return enabled.current;
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !canTilt()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg) scale(${lift})`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div
      ref={ref}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ transition: "transform 0.25s ease-out", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
