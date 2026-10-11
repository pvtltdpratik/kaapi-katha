"use client";

import { motion } from "framer-motion";
import { slideInLeft, slideInRight } from "@/lib/animations";

export default function AboutSection() {
  return (
    <section id="about" className="relative min-h-screen py-32 md:py-44 bg-[#120C09] overflow-hidden flex flex-col justify-center">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#D4943A]/5 -skew-x-12 translate-x-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left - visual; on large screens the 3D cup takes this lane */}
          <div data-cup="about" className="relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideInLeft}
            className="relative"
          >
            <div className="about-photo aspect-[4/5] relative overflow-hidden border border-white/10 p-4">
              <div
                className="w-full h-full bg-[#1D130E]"
                style={{
                  backgroundImage: `url(/images/coffee/about_brand.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            </div>
            {/* Signature seal */}
            <div className="absolute -bottom-6 right-4 md:-right-6 w-32 h-32 bg-[#D4943A] rounded-full flex flex-col items-center justify-center p-4 text-center">
              <span
                className="text-[#120C09] text-lg leading-none mb-1"
                style={{ fontFamily: "var(--font-deva)" }}
              >
                कहानी
              </span>
              <span
                className="text-[#120C09] text-[0.55rem] font-bold uppercase tracking-widest leading-tight"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Made in 2026
              </span>
            </div>
          </motion.div>
          </div>

          {/* Right - Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={slideInRight}
          >
            <p
              className="text-[#D4943A] text-[0.65rem] uppercase mb-4"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.35em" }}
            >
              About this project
            </p>
            <h2
              className="text-4xl md:text-6xl text-[#F3E8D4] font-medium mb-8 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              An imagined café, <br />
              <span className="italic text-[#E3AE62]">built in code</span>
            </h2>

            <div className="space-y-6 text-white/55 text-sm md:text-base leading-relaxed">
              <p>
                Kaapi Katha is a make-believe café: a love letter to filter
                coffee, steel tumblers and the long conversations that happen
                around them. It is not a real business, and it is not
                affiliated with any existing brand.
              </p>
              <p>
                The cup that has been following you down the page is modelled
                procedurally and rendered live in your browser with WebGL. It
                reads your scroll position, so it moves exactly as fast as you
                do. The photographs are placeholders.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-white text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-mono)" }}>The idea</h4>
                <p className="text-white/40 text-xs leading-relaxed">Take a daily ritual seriously, and let it feel new on the web.</p>
              </div>
              <div>
                <h4 className="text-white text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "var(--font-mono)" }}>The craft</h4>
                <p className="text-white/40 text-xs leading-relaxed">Real-time 3D, restrained motion, and type that respects the words.</p>
              </div>
            </div>

            {/* Creator signature */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <p
                className="text-[#E3AE62] text-2xl md:text-3xl italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Pratik Prashant Kolhe
              </p>
              <p
                className="text-white/40 text-[0.65rem] uppercase mt-2"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
              >
                Concept, design &amp; development
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
