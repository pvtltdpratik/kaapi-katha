"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, whenMotionAllowed } from "@/lib/gsap";

/**
 * Content that arrives *with* the scroll rather than on a timer: opacity and
 * rise are tied to scroll progress (scrubbed), so it can also leave again if
 * you scroll back up. Optional `parallax` moves an inner element slowly against
 * the page, used on photographs.
 */
export default function ScrollScrub({
  children,
  className = "",
  y = 44,
  start = "top 90%",
  end = "top 55%",
  parallax = 0,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  start?: string;
  end?: string;
  /** percent the first [data-parallax] child drifts over the element's travel */
  parallax?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return whenMotionAllowed(() => {
      const tweens: gsap.core.Tween[] = [];
      tweens.push(
        gsap.fromTo(
          el,
          { y, opacity: 0 },
          { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start, end, scrub: 0.5 } }
        )
      );
      const inner = el.querySelector<HTMLElement>("[data-parallax]");
      if (inner && parallax) {
        tweens.push(
          gsap.fromTo(
            inner,
            { yPercent: -parallax },
            { yPercent: parallax, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } }
          )
        );
      }
      return () => {
        tweens.forEach((t) => {
          t.scrollTrigger?.kill();
          t.kill();
        });
        gsap.set([el, inner].filter(Boolean) as HTMLElement[], { clearProps: "all" });
      };
    });
  }, [y, start, end, parallax]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
