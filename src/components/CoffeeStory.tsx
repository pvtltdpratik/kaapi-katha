"use client";

import ScrollScrub from "@/components/motion/ScrollScrub";
import SplitText from "@/components/motion/SplitText";

/*
 * Three short passages. Text takes one half; the other half stays open for the
 * cup, which crosses to the opposite side with each passage. The copy arrives
 * with the scroll (scrubbed), so as the cup settles beside a passage the passage
 * has just finished arriving. Photos drift a little against the page.
 */
const passages = [
  {
    title: "Dark roast, a little chicory.",
    text: "Indian coffee grows in the shade of the Western Ghats. Filter kaapi likes it dark, with a spoon of chicory for body.",
    image: "/images/coffee/story_craft.jpg",
    alt: "A coffee roaster turning dark beans",
    shape: "aspect-[4/5] w-3/5",
    align: "",
  },
  {
    title: "Pulled, not stirred.",
    text: "Decoction first, then hot milk. The tumbler and the davara trade it back and forth until it foams and cools to something drinkable.",
    image: "/images/coffee/story_philosophy.jpg",
    alt: "Hands holding cups of coffee over a wooden table",
    shape: "aspect-[16/10] w-full",
    align: "",
  },
  {
    title: "A table that doesn't hurry you.",
    text: "The old Irani cafés and coffee houses understood this: one order, a window seat, and nobody checking the time.",
    image: "/images/coffee/story_origin.jpg",
    alt: "A café sign glowing above a counter",
    shape: "aspect-square w-2/5",
    align: "ml-auto",
  },
];

export default function CoffeeStory() {
  return (
    <section id="story" className="theme-yellow bg-ground text-fg relative py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {passages.map((p, i) => (
          <div
            key={p.title}
            data-cup={`story-${i}`}
            className="relative lg:min-h-[80vh] flex items-center py-12 lg:py-0"
          >
            <div className={`w-full lg:w-[44%] ${i % 2 === 1 ? "lg:ml-auto" : ""}`}>
              <SplitText text={p.title} as="h2" className="display text-3xl md:text-5xl text-fg mb-5" />
              <ScrollScrub y={28} start="top 92%" end="top 62%">
                <p className="text-fg/70 text-base leading-relaxed max-w-md mb-8">{p.text}</p>
              </ScrollScrub>
              <ScrollScrub y={60} start="top 98%" end="top 60%" parallax={7}>
                <div className={`overflow-hidden bg-surface ${p.shape} ${p.align}`}>
                  <div
                    data-parallax
                    className="w-full h-[118%] -mt-[9%]"
                    role="img"
                    aria-label={p.alt}
                    style={{
                      backgroundImage: `url(${p.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              </ScrollScrub>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
