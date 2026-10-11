"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { label: "Story", href: "#story" },
  { label: "Menu", href: "#menu" },
  { label: "Build a cup", href: "#customizer" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { cartCount, setCartOpen } = useCart();

  return (
    <header
      className="theme-espresso fixed top-0 inset-x-0 z-50 bg-ground text-fg border-b border-fg/10"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a href="#home" className="display text-xl md:text-2xl text-fg">
          Kaapi Katha
        </a>

        <nav className="hidden lg:flex items-center gap-9" aria-label="Main">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-fg/70 hover:text-fg transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="text-sm text-fg border border-fg/25 hover:border-accent hover:text-accent transition-colors px-4 py-2 cursor-pointer"
          >
            Order{cartCount > 0 ? ` (${cartCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden px-3 py-2 text-sm text-fg cursor-pointer"
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" className="lg:hidden px-6 pb-8 pt-2 flex flex-col" aria-label="Main">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="display text-3xl py-3 border-b border-fg/10 text-fg"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
