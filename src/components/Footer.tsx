"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { menuData } from "@/data/menuData";

const footerLinks: Record<string, { label: string; href: string }[]> = {
  "On the counter": menuData.map((m) => ({ label: m.name, href: "#menu" })),
  Explore: [
    { label: "The story", href: "#story" },
    { label: "Build a cup", href: "#customizer" },
    { label: "Moments", href: "#gallery" },
    { label: "Little rituals", href: "#rituals" },
    { label: "About", href: "#about" },
  ],
};

const stack = ["Next.js", "Three.js", "Framer Motion", "Tailwind CSS"];

export default function Footer() {
  return (
    <footer className="relative bg-[#120C09] border-t border-white/5 overflow-hidden">
      {/* Giant Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span
          className="text-[14vw] md:text-[11vw] font-medium text-white/[0.03] whitespace-nowrap select-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Kaapi Katha
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-20 md:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <h3
                className="text-[#F3E8D4] text-xl font-medium mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Kaapi Katha
              </h3>
              <p className="text-white/40 text-xs leading-relaxed max-w-xs">
                A little more India in every pour. A fictional café, made as a
                creative coding project.
              </p>
            </div>

            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4
                  className="text-[#D4943A] text-[0.6rem] uppercase mb-6"
                  style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.25em" }}
                >
                  {category}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-white/50 hover:text-white text-xs transition-colors duration-300"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Creator column */}
            <div>
              <h4
                className="text-[#D4943A] text-[0.6rem] uppercase mb-6"
                style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.25em" }}
              >
                Made by
              </h4>
              <p className="text-[#F3E8D4] text-sm mb-1" style={{ fontFamily: "var(--font-display)" }}>
                Pratik Prashant Kolhe
              </p>
              <p className="text-white/40 text-xs leading-relaxed mb-5">
                An interactive 3D web experience, crafted with creativity and code.
              </p>
              <ul className="space-y-1">
                {stack.map((s) => (
                  <li key={s} className="text-white/30 text-[0.65rem]" style={{ fontFamily: "var(--font-mono)" }}>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p
              className="text-white/30 text-[0.6rem] uppercase"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}
            >
              © 2026 Pratik Prashant Kolhe
            </p>
            <p
              className="text-white/30 text-[0.6rem] uppercase"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}
            >
              Fictional concept · not affiliated with any existing brand
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
