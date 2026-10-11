"use client";

import { menuData } from "@/data/menuData";
import { useCart } from "@/context/CartContext";

/*
 * A menu is a list, so it's drawn as one: name, one line, price, thumbnail.
 * The right third is left open for the cup.
 */
export default function MenuGrid() {
  const { addToCart } = useCart();

  return (
    <section id="menu" className="relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:pr-[36%]">
        <h2 className="display text-4xl md:text-6xl text-[#efe6d6] mb-12">On the counter</h2>

        <ul className="border-t border-white/15">
          {menuData.map((item) => (
            <li key={item.id} className="border-b border-white/15">
              <button
                type="button"
                onClick={() => addToCart(item)}
                aria-label={`Add ${item.name} to your order, ${item.price}`}
                className="group w-full grid grid-cols-[72px_1fr_auto] md:grid-cols-[96px_1fr_auto] gap-5 md:gap-7 items-center py-5 text-left cursor-pointer"
              >
                <div className="aspect-square overflow-hidden bg-[#1b1511]">
                  <div
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${item.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="display text-2xl md:text-3xl text-[#efe6d6] group-hover:text-[#d19a4f] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-[#efe6d6]/60 mt-1.5 max-w-sm">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-[#efe6d6] tabular-nums">{item.price}</p>
                  <p className="text-sm text-[#efe6d6]/50 group-hover:text-[#d19a4f] transition-colors mt-1">
                    Add +
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
