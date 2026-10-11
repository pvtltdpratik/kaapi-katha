"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

/*
 * Three short passages. Text takes one half; the other half stays open for the
 * cup. Each photo is cropped differently and sits differently against its text,
 * so the section doesn't repeat one template three times.
 */
const passages = [
  {
    title: "Dark roast, a little chicory.",
    text: "Indian coffee grows in the shade of the Western Ghats. Filter kaapi likes it dark, with a spoon of chicory for body.",
    image: "/images/coffee/story_craft.jpg",
    shape: "aspect-[4/5] w-3/5",
    align: "",
  },
  {
    title: "Pulled, not stirred.",
    text: "Decoction first, then hot milk. The tumbler and the davara trade it back and forth until it foams and cools to something drinkable.",
    image: "/images/coffee/story_philosophy.jpg",
    shape: "aspect-[16/10] w-full",
    align: "",
  },
  {
    title: "A table that doesn't hurry you.",
    text: "The old Irani cafés and coffee houses understood this: one order, a window seat, and nobody checking the time.",
    image: "/images/coffee/story_origin.jpg",
    shape: "aspect-square w-2/5",
    align: "ml-auto",
  },
];

export default function CoffeeStory() {
  return (
    <section id="story" className="relative py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {passages.map((p, i) => (
          <div
            key={p.title}
            data-cup={`story-${i}`}
            className="relative lg:min-h-[80vh] flex items-center py-12 lg:py-0"
          >
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              className={`w-full lg:w-[44%] ${i % 2 === 1 ? "lg:ml-auto" : ""}`}
            >
              <h2 className="display text-3xl md:text-5xl text-[#efe6d6] mb-5">{p.title}</h2>
              <p className="text-[#efe6d6]/65 text-base leading-relaxed max-w-md mb-8">{p.text}</p>
              <div className={`overflow-hidden bg-[#1b1511] ${p.shape} ${p.align}`}>
                <div
                  className="w-full h-full"
                  role="img"
                  aria-label={p.title}
                  style={{
                    backgroundImage: `url(${p.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
