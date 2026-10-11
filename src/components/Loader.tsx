"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const DURATION_MS = 1600;

export default function Loader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(true);
  const reduced = !!useReducedMotion();

  useEffect(() => {
    const total = reduced ? 200 : DURATION_MS;
    const start = Date.now();
    const id = window.setInterval(() => {
      const p = Math.min((Date.now() - start) / total, 1);
      setProgress(Math.round(p * 100));
      if (p >= 1) {
        window.clearInterval(id);
        setShow(false);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#120C09]"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12 text-center"
          >
            <h1
              className="text-3xl md:text-5xl font-medium text-[#F3E8D4] tracking-[0.04em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Kaapi Katha
            </h1>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="block w-8 h-[1px] bg-[#D4943A]" />
              <span
                className="text-[#D4943A] text-sm"
                style={{ fontFamily: "var(--font-deva)" }}
              >
                कॉफ़ी की कहानी
              </span>
              <span className="block w-8 h-[1px] bg-[#D4943A]" />
            </div>
          </motion.div>

          <div className="w-48 md:w-64">
            <div className="h-[1px] bg-white/10 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-[#D4943A]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p
              className="text-center text-white/40 text-[0.65rem] mt-4"
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }}
            >
              Brewing the decoction… {progress}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
