"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { galleryData } from "@/data/galleryData";
import { fadeUp } from "@/lib/animations";

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
    <section id="gallery" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:pl-[36%]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeUp}
        >
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
            {galleryData.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelected(img.id)}
                aria-label={`Enlarge: ${img.alt}`}
                className={`relative overflow-hidden bg-[#1b1511] cursor-zoom-in ${layout[i] ?? "lg:col-span-3 aspect-[4/3]"} ${
                  i === 0 ? "col-span-2" : ""
                }`}
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
            ))}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-[#14100d]/95 flex flex-col items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
          >
            <div
              className="w-full max-w-4xl aspect-[16/10] bg-[#1b1511]"
              style={{
                backgroundImage: `url(${current.src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <p className="mt-4 text-sm text-[#efe6d6]/70">{current.alt}</p>
            <button
              type="button"
              className="absolute top-5 right-6 text-sm text-[#efe6d6]/80 hover:text-[#efe6d6] cursor-pointer"
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
