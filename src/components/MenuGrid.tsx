"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { menuData } from "@/data/menuData";
import { fadeUp, staggerContainer, staggerItem } from "@/lib/animations";
import { useCart } from "@/context/CartContext";

export default function MenuGrid() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { addToCart } = useCart();

  return (
    <section id="menu" className="relative min-h-screen py-32 md:py-44 bg-[#120C09] flex flex-col justify-center overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 lg:pr-[36%]">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="text-center lg:text-left mb-16 max-w-4xl"
        >
          <p
            className="text-[#D4943A] text-[0.65rem] uppercase mb-4"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.35em" }}
          >
            On the Counter
          </p>
          <h2
            className="text-3xl md:text-5xl lg:text-6xl text-white font-semibold mb-6"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "0.02em" }}
          >
            Poured for every{" "}
            <span className="italic text-[#D4943A]">mood</span>
          </h2>
          <div className="section-divider mx-auto lg:mx-0 mt-8" />
        </motion.div>

        {/* Bento Grid - Full Width */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {menuData.map((item, index) => (
            <motion.div
              key={item.id}
              variants={staggerItem}
              role="button"
              tabIndex={0}
              aria-label={`Add ${item.name} to your order`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  addToCart(item);
                }
              }}
              onFocus={() => setHoveredId(item.id)}
              onBlur={() => setHoveredId(null)}
              className={`group relative overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E3AE62] ${
                index === 0 ? "sm:col-span-2" : ""
              }`}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => addToCart(item)}
            >
              <div
                className={`relative overflow-hidden ${
                  index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"
                }`}
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#120C09] via-[#120C09]/60 to-[#120C09]/20 transition-all duration-500" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
                  <span
                    className="text-[#D4943A] text-[0.55rem] uppercase block mb-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.3em",
                    }}
                  >
                    {item.subtitle}
                  </span>
                  <h3
                    className="text-xl md:text-2xl text-white font-semibold mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-white/40 text-xs md:text-sm leading-relaxed mb-4 max-w-sm">
                    {item.description}
                  </p>

                  {/* Price + Arrow — revealed on hover */}
                  <motion.div
                    initial={false}
                    animate={{
                      opacity: hoveredId === item.id ? 1 : 0.6,
                      y: hoveredId === item.id ? 0 : 10,
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="text-white text-lg font-medium"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {item.price}
                    </span>
                    <span className="text-[#D4943A] text-xs uppercase tracking-widest font-bold transition-all duration-300 group-hover:translate-x-1" style={{ fontFamily: "var(--font-mono)" }}>
                      + Add to order
                    </span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
