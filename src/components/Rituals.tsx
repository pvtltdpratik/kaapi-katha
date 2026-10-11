"use client";

import SplitText from "@/components/motion/SplitText";

/** One line, set large and revealed word by word. Nothing here needs to rotate. */
export default function Rituals() {
  return (
    <section id="rituals" className="theme-red bg-ground text-fg relative py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:pr-[38%]">
        <SplitText
          as="p"
          stagger={0.07}
          text="Two cups, one table, and a conversation that ran an hour past the bill."
          className="display text-3xl md:text-5xl lg:text-6xl text-fg max-w-3xl"
        />
      </div>
    </section>
  );
}
