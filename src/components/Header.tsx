"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { label: "Story", href: "#story" },
  { label: "Menu", href: "#menu" },
  { label: "Build a cup", href: "#customizer" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { cartCount, setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "bg-[#14100d]/95 border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a href="#home" className="display text-xl md:text-2xl text-[#efe6d6]">
          Kaapi Katha
        </a>

        <nav className="hidden lg:flex items-center gap-9" aria-label="Main">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[#efe6d6]/70 hover:text-[#efe6d6] transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="text-sm text-[#efe6d6] border border-white/25 hover:border-[#d19a4f] hover:text-[#d19a4f] transition-colors px-4 py-2 cursor-pointer"
          >
            Order{cartCount > 0 ? ` (${cartCount})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden px-3 py-2 text-sm text-[#efe6d6] cursor-pointer"
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
              className="display text-3xl py-3 border-b border-white/10 text-[#efe6d6]"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
