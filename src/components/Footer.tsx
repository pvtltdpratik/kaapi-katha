"use client";

const links = [
  { label: "Story", href: "#story" },
  { label: "Menu", href: "#menu" },
  { label: "Build a cup", href: "#customizer" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/15 mt-10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div>
            <p className="display text-3xl text-[#efe6d6]">Kaapi Katha</p>
            <p className="text-sm text-[#efe6d6]/55 mt-2">
              A fictional café. Not affiliated with any brand.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-7 gap-y-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-[#efe6d6]/70 hover:text-[#d19a4f] transition-colors">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <p className="text-xs text-[#efe6d6]/45 mt-12">
          Concept, design and development by Pratik Prashant Kolhe · © 2026 · Built with Next.js and three.js
        </p>
      </div>
    </footer>
  );
}
