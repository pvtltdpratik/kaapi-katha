"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ritualData } from "@/data/ritualData";
import { fadeUp } from "@/lib/animations";

export default function Rituals() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % ritualData.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  const testimonial = ritualData[current];

  return (
    <section id="rituals" className="relative py-32 md:py-44 bg-[#120C09]">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center mb-20"
        >
          <p
            className="text-[#D4943A] text-[0.65rem] uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.35em" }}
          >
            Little Rituals
          </p>
          <h2
            className="text-3xl md:text-5xl lg:text-6xl text-white font-semibold mb-6"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
          >
            Cups that mark{" "}
            <span className="italic text-[#D4943A]">the day</span>
          </h2>
          <div className="section-divider mx-auto mt-4" />
        </motion.div>

        {/* Carousel */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-3xl"
            >
              {/* Quote */}
              <blockquote
                className="text-white/80 text-lg md:text-2xl leading-relaxed mb-10 italic"
                style={{ fontFamily: "var(--font-display)" }}
              >
                &ldquo;{testimonial.line}&rdquo;
              </blockquote>

              <p
                className="text-[#D4943A] text-[0.65rem] uppercase"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.3em" }}
              >
                {testimonial.moment}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-3 mt-12">
          {ritualData.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "bg-[#D4943A] w-6"
                  : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Ritual ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
