"use client";

import { menuData } from "@/data/menuData";
import { useCart } from "@/context/CartContext";
import SplitText from "@/components/motion/SplitText";
import ScrollScrub from "@/components/motion/ScrollScrub";
import TiltCard from "@/components/motion/TiltCard";

/*
 * A menu is a list, so it's drawn as one: photo, name, one line, price.
 * Pressing a row adds it to the order. The right third stays open for the cup.
 */
export default function MenuGrid() {
  const { addToCart } = useCart();

  return (
    <section id="menu" className="theme-yellow bg-ground text-fg relative py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:pr-[36%]">
        <SplitText text="On the counter" as="h2" className="display text-4xl md:text-6xl text-fg mb-12" />

        <ul className="border-t border-fg/20">
          {menuData.map((item) => (
            <li key={item.id} className="border-b border-fg/20">
              <ScrollScrub y={26} start="top 96%" end="top 78%">
                <button
                  type="button"
                  onClick={() => addToCart(item)}
                  aria-label={`Add ${item.name} to your order, ${item.price}`}
                  className="group w-full grid grid-cols-[76px_1fr_auto] md:grid-cols-[104px_1fr_auto] gap-5 md:gap-7 items-center py-5 text-left cursor-pointer"
                >
                  <TiltCard className="aspect-square overflow-hidden bg-surface" max={9}>
                    <div
                      className="w-full h-full"
                      role="img"
                      aria-label={`${item.name}`}
                      style={{
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                  </TiltCard>
                  <div className="min-w-0">
                    <h3 className="display text-2xl md:text-3xl text-fg group-hover:text-accent transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-fg/70 mt-1.5 max-w-sm">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg text-fg tabular-nums">{item.price}</p>
                    <p className="text-sm text-fg/60 group-hover:text-accent transition-colors mt-1">Add +</p>
                  </div>
                </button>
              </ScrollScrub>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
