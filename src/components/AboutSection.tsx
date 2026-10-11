"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

export default function AboutSection() {
  return (
    <section id="about" className="theme-yellow bg-ground text-fg relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* left lane: the cup lands here on large screens; the photo covers small ones */}
        <div data-cup="about" className="lg:col-span-5 relative">
          <div
            className="about-photo aspect-[4/5] bg-surface"
            role="img"
            aria-label="Inside a busy café"
            style={{
              backgroundImage: "url(/images/coffee/about_brand.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="hidden lg:block aspect-[4/5] absolute inset-0 -z-10" />
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="lg:col-span-6 lg:col-start-7"
        >
          <h2 className="display text-4xl md:text-6xl text-fg mb-8">
            A café that doesn&apos;t exist, built carefully.
          </h2>
          <div className="space-y-5 text-fg/65 text-base leading-relaxed max-w-lg">
            <p>
              Kaapi Katha is a made-up café: a study in filter coffee, steel tumblers and long
              conversations. It isn&apos;t a business and isn&apos;t affiliated with any brand.
            </p>
            <p>
              The cup you&apos;ve been following is modelled in code and rendered live in your
              browser. It reads your scroll position and nothing else. The photographs are
              placeholders.
            </p>
          </div>

          <p className="mt-12 text-sm text-fg/55">
            Concept, design and development by{" "}
            <span className="text-fg">Pratik Prashant Kolhe</span>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
