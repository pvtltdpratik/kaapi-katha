"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { formatINR, parsePrice } from "@/lib/utils";

export default function CartDrawer() {
  const { cart, cartTotal, isCartOpen, setCartOpen, updateQuantity, removeFromCart, clearCart } = useCart();

  const [placed, setPlaced] = useState<string | null>(null);

  // the order summary needs the lines that were just placed, so keep a copy
  const [receipt, setReceipt] = useState<typeof cart>([]);
  const [receiptTotal, setReceiptTotal] = useState(0);

  const close = () => {
    setCartOpen(false);
    window.setTimeout(() => setPlaced(null), 300);
  };

  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCartOpen(false);
        window.setTimeout(() => setPlaced(null), 300);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isCartOpen, setCartOpen]);

  const placeOrder = () => {
    setReceipt(cart);
    setReceiptTotal(cartTotal);
    setPlaced("KK-" + Math.floor(100000 + Math.random() * 900000));
    clearCart();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 bg-black/60 z-[70] cursor-pointer"
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="theme-espresso text-fg fixed top-0 right-0 h-screen w-full sm:w-[440px] bg-surface border-l border-fg/10 z-[80] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Your order"
            data-lenis-prevent
          >
            <div className="px-6 md:px-8 py-6 border-b border-fg/10 flex items-center justify-between">
              <h2 className="display text-2xl text-fg">{placed ? "Order placed" : "Your order"}</h2>
              <button
                type="button"
                onClick={close}
                className="text-sm text-fg/70 hover:text-fg cursor-pointer"
              >
                Close
              </button>
            </div>

            {!placed && (
              <>
                <div className="flex-1 overflow-y-auto px-6 md:px-8">
                  {cart.length === 0 ? (
                    <p className="text-fg/60 text-sm pt-10 leading-relaxed">
                      Nothing here yet. Pick something from the menu, or build your own cup.
                    </p>
                  ) : (
                    <ul>
                      {cart.map(({ item, quantity }) => (
                        <li key={item.id} className="py-5 border-b border-fg/10 flex gap-4">
                          <div
                            className="w-16 h-16 shrink-0 bg-ground"
                            style={{
                              backgroundImage: `url(${item.image})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-3">
                              <h3 className="text-fg text-sm font-medium">{item.name}</h3>
                              <span className="text-fg text-sm tabular-nums">
                                {formatINR(parsePrice(item.price) * quantity)}
                              </span>
                            </div>
                            {item.config && (
                              <p className="text-xs text-fg/55 mt-1 leading-snug">{item.subtitle}</p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-3 text-sm text-fg">
                                <button
                                  type="button"
                                  aria-label={`Fewer ${item.name}`}
                                  onClick={() => updateQuantity(item.id, quantity - 1)}
                                  className="w-7 h-7 border border-fg/15 hover:border-fg/40 cursor-pointer"
                                >
                                  −
                                </button>
                                <span className="tabular-nums w-4 text-center">{quantity}</span>
                                <button
                                  type="button"
                                  aria-label={`More ${item.name}`}
                                  onClick={() => updateQuantity(item.id, quantity + 1)}
                                  className="w-7 h-7 border border-fg/15 hover:border-fg/40 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="text-xs text-fg/50 hover:text-accent cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="px-6 md:px-8 py-6 border-t border-fg/10">
                    <div className="flex justify-between items-baseline mb-5">
                      <span className="text-sm text-fg/70">Subtotal</span>
                      <span className="display text-3xl text-fg tabular-nums">{formatINR(cartTotal)}</span>
                    </div>
                    <button type="button" onClick={placeOrder} className="btn w-full justify-center py-4">
                      Place order
                    </button>
                    <p className="text-xs text-fg/45 mt-3">Demo only. Nothing is charged or made.</p>
                  </div>
                )}
              </>
            )}

            {placed && (
              <div className="flex-1 overflow-y-auto px-6 md:px-8 py-8 flex flex-col">
                <p className="text-sm text-fg/60">Order {placed}</p>
                <ul className="mt-6 space-y-2">
                  {receipt.map((c) => (
                    <li key={c.item.id} className="flex justify-between text-sm">
                      <span className="text-fg/80">
                        {c.item.name} <span className="text-fg/45">× {c.quantity}</span>
                      </span>
                      <span className="text-fg tabular-nums">
                        {formatINR(parsePrice(c.item.price) * c.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-baseline border-t border-fg/15 mt-5 pt-4">
                  <span className="text-sm text-fg/70">Total</span>
                  <span className="display text-2xl text-fg tabular-nums">{formatINR(receiptTotal)}</span>
                </div>
                <p className="text-sm text-fg/55 mt-8 leading-relaxed">
                  Kaapi Katha is a fictional café. No payment was taken and nothing will be delivered.
                </p>
                <button type="button" onClick={close} className="btn justify-center mt-auto py-4">
                  Done
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
