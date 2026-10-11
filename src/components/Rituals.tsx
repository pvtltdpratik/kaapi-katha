"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animations";

/** One line, set large. No carousel: nothing here needs to rotate. */
export default function Rituals() {
  return (
    <section id="rituals" className="theme-red bg-ground text-fg relative py-28 lg:py-40">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:pr-[38%]">
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-120px" }}
          variants={fadeIn}
          className="display text-3xl md:text-5xl lg:text-6xl text-fg max-w-3xl"
        >
          Two cups, one table, and a conversation that ran an hour past the bill.
        </motion.p>
      </div>
    </section>
  );
}
