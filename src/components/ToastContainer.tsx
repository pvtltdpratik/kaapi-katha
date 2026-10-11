"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useCart();

  return (
    <div
      className="theme-espresso fixed bottom-5 left-5 z-[100] flex flex-col gap-2 pointer-events-none max-w-xs w-[calc(100%-2.5rem)]"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-3 bg-fg text-ground text-sm"
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-xs underline underline-offset-2 cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
