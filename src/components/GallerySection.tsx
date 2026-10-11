"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { galleryData } from "@/data/galleryData";
import ScrollScrub from "@/components/motion/ScrollScrub";
import TiltCard from "@/components/motion/TiltCard";

// Varied scale and offset, so the photographs read as a set rather than a grid.
const layout = [
  "lg:col-span-4 aspect-[4/3]",
  "lg:col-span-2 aspect-[3/4] lg:mt-14",
  "lg:col-span-2 aspect-square",
  "lg:col-span-4 aspect-[16/10]",
  "lg:col-span-3 aspect-[4/3]",
  "lg:col-span-3 aspect-[4/3] lg:mt-10",
];

export default function GallerySection() {
  const [selected, setSelected] = useState<number | null>(null);
  const current = galleryData.find((g) => g.id === selected);

  return (
    <section id="gallery" className="theme-yellow bg-ground text-fg relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:pl-[36%]">
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
          {galleryData.map((img, i) => (
            <ScrollScrub
              key={img.id}
              y={40 + (i % 3) * 14}
              start="top 98%"
              end="top 74%"
              className={`${layout[i] ?? "lg:col-span-3 aspect-[4/3]"} ${i === 0 ? "col-span-2" : ""}`}
            >
              <TiltCard className="w-full h-full overflow-hidden bg-surface" max={5} lift={1.02}>
                <button
                  type="button"
                  onClick={() => setSelected(img.id)}
                  aria-label={`Enlarge: ${img.alt}`}
                  className="relative block w-full h-full cursor-zoom-in"
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${img.src})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </button>
              </TiltCard>
            </ScrollScrub>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="theme-espresso text-fg fixed inset-0 z-[90] bg-ground/95 flex flex-col items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
            data-lenis-prevent
          >
            <div
              className="w-full max-w-4xl aspect-[16/10] bg-surface"
              style={{
                backgroundImage: `url(${current.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <p className="mt-4 text-sm text-fg/70">{current.alt}</p>
            <button
              type="button"
              className="absolute top-5 right-6 text-sm text-fg/80 hover:text-fg cursor-pointer"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
