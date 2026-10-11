"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger, whenMotionAllowed } from "@/lib/gsap";

/**
 * Word-by-word headline reveal (in the spirit of ReactBits' SplitText).
 * Each word rises out of a clipped line box once, when it scrolls into view.
 * The full text is exposed to assistive tech via aria-label, and without
 * motion (or before JS) the words are simply there.
 */
export default function SplitText({
  text,
  as = "h2",
  className = "",
  stagger = 0.06,
  start = "top 88%",
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const Tag = as as "h2";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return whenMotionAllowed(() => {
      const words = el.querySelectorAll<HTMLElement>("[data-word]");
      gsap.set(words, { yPercent: 115, opacity: 0 });
      const tween = gsap.to(words, {
        yPercent: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
        gsap.set(words, { clearProps: "all" });
      };
    });
  }, [text, stagger, start]);

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
          <span data-word className="inline-block will-change-transform">
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </Tag>
  );
}

// keep ScrollTrigger referenced so tree-shaking never drops the plugin registration
void ScrollTrigger;
