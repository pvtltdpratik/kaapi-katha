"use client";

import { motion } from "framer-motion";
import { fadeUp, slideInLeft, slideInRight } from "@/lib/animations";

const storyBlocks = [
  {
    subtitle: "Roast",
    title: "Slow, never hurried",
    text: "Indian coffee grows in the shade of the Western Ghats, between pepper vines and silver oak. A slow roast keeps that mellow, spiced sweetness intact. Filter kaapi loves a dark roast with a little chicory for body.",
    image: "/images/coffee/story_craft.jpg",
  },
  {
    subtitle: "Ritual",
    title: "Pulled, poured, passed",
    text: "Decoction goes in, hot milk follows, and the pour travels between tumbler and davara until it froths. It cools the coffee, it is a small performance, and it is why a steel tumbler never feels like a mug.",
    image: "/images/coffee/story_philosophy.jpg",
  },
  {
    subtitle: "Adda",
    title: "A table for long talks",
    text: "From old Irani cafés to coffee-house counters, the best seat was always the one that let a conversation run late. We design for that: warm light, no rush, and a refill when the talking is not done.",
    image: "/images/coffee/story_origin.jpg",
  },
];

export default function CoffeeStory() {
  return (
    <section id="story" className="relative min-h-screen py-32 md:py-44 bg-[#120C09] flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center mb-24"
        >
          <p
            className="text-[#D4943A] text-[0.65rem] uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.35em" }}
          >
            The Story
          </p>
          <h2
            className="text-3xl md:text-5xl lg:text-6xl text-white font-semibold mb-6"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
          >
            From the Ghats to{" "}
            <span className="italic text-[#D4943A]">your glass</span>
          </h2>
          <p className="text-white/40 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Coffee reached India&apos;s hills centuries ago and settled into
            daily life as a ceremony. This is a small, imagined chapter of that
            story.
          </p>
          <div className="section-divider mx-auto mt-8" />
        </motion.div>

        {/* Story Blocks */}
        <div className="space-y-32 md:space-y-44">
          {storyBlocks.map((block, i) => (
            <div
              key={block.subtitle}
              className={`flex flex-col ${
                i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } items-center gap-12 md:gap-20`}
            >
              {/* Text Side */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={i % 2 === 0 ? slideInLeft : slideInRight}
                className="flex-1 max-w-lg"
              >
                <span
                  className="text-[#D4943A] text-[0.6rem] uppercase block mb-4"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.3em",
                  }}
                >
                  {String(i + 1).padStart(2, "0")} — {block.subtitle}
                </span>
                <h3
                  className="text-2xl md:text-4xl text-white font-semibold mb-6 leading-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {block.title}
                </h3>
                <p className="text-white/50 text-sm md:text-base leading-[1.8]">
                  {block.text}
                </p>
              </motion.div>

              {/* Image Side */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={i % 2 === 0 ? slideInRight : slideInLeft}
                className="flex-1 w-full max-w-lg"
              >
                <div className="relative aspect-[4/5] overflow-hidden group">
                  <div
                    className="absolute inset-0 bg-[#1D130E]"
                    style={{
                      backgroundImage: `url(${block.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="absolute inset-0 bg-[#120C09]/20 group-hover:bg-[#120C09]/10 transition-all duration-700" />
                  {/* Frame Border */}
                  <div className="absolute inset-4 border border-white/10" />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
