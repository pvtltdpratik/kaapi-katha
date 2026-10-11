"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";
import Puppy from "./PuppyCompanion";

/*
 * Puppy companion navigation (replaces the old header).
 *
 * Interaction rule: the dock wrapper never receives pointer events. Only the
 * puppy button and the open menu panel opt back in, and the closed panel is
 * visibility:hidden, so nothing here can sit invisibly over the page.
 */

const ICONS: Record<string, string> = {
  home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  story: "M4 5a2 2 0 012-2h5v17H6a2 2 0 00-2 2V5zM20 5a2 2 0 00-2-2h-5v17h5a2 2 0 012 2V5z",
  menu: "M5 8h11v6a4 4 0 01-4 4H9a4 4 0 01-4-4V8zM16 9h2a2 2 0 010 4h-2M8 3v2M12 3v2",
  build: "M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4",
  gallery: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01",
  about: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5h.01",
  order: "M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0",
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** These are the pages/sections that really exist on the site. */
const ITEMS = [
  { id: "home", href: "#home", label: "Home", icon: "home" },
  { id: "story", href: "#story", label: "Story", icon: "story" },
  { id: "menu", href: "#menu", label: "Menu", icon: "menu" },
  { id: "customizer", href: "#customizer", label: "Build a cup", icon: "build" },
  { id: "gallery", href: "#gallery", label: "Gallery", icon: "gallery" },
  { id: "about", href: "#about", label: "About", icon: "about" },
] as const;

function Poppy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 90" className={className} aria-hidden="true" focusable="false">
      <path d="M30 40 C30 60 26 74 20 88" fill="none" stroke="#5f8a3c" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M28 66 C18 64 12 58 10 52 C20 52 26 58 28 66Z" fill="#79a64c" />
      <g transform="translate(30 30)">
        <path d="M0 0 C-14 -4 -22 -14 -14 -22 C-6 -26 0 -14 0 0Z" fill="#d6372b" />
        <path d="M0 0 C14 -4 22 -14 14 -22 C6 -26 0 -14 0 0Z" fill="#e24a3b" />
        <path d="M0 0 C-12 8 -22 6 -20 -4 C-14 -10 -4 -6 0 0Z" fill="#c92d22" />
        <path d="M0 0 C12 8 22 6 20 -4 C14 -10 4 -6 0 0Z" fill="#d6372b" />
        <circle cx="0" cy="0" r="4" fill="#2c2418" />
      </g>
    </svg>
  );
}

const BURST = Array.from({ length: 7 }, (_, i) => ({
  dx: Math.cos((i / 7) * Math.PI * 2 - Math.PI / 2) * (34 + (i % 3) * 8),
  dy: Math.sin((i / 7) * Math.PI * 2 - Math.PI / 2) * (34 + (i % 3) * 8) - 14,
  delay: i * 40,
  kind: i % 2 === 0 ? "heart" : "spark",
}));

export default function PuppyNav() {
  const { cartCount, setCartOpen } = useCart();

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Tap to make me happy!");
  const [showMsg, setShowMsg] = useState(true);
  const [burst, setBurst] = useState(0);
  const [active, setActive] = useState("home");

  const dockRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const happyTimer = useRef<number | undefined>(undefined);
  const msgTimer = useRef<number | undefined>(undefined);
  const touched = useRef(false);

  const setMood = useCallback((mood: "idle" | "happy", ms = 0) => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.dataset.mood = mood;
    window.clearTimeout(happyTimer.current);
    if (mood === "happy" && ms > 0) {
      happyTimer.current = window.setTimeout(() => {
        if (svgRef.current) svgRef.current.dataset.mood = "idle";
      }, ms);
    }
  }, []);

  // the text stays put while the bubble fades, so it never flashes empty
  const say = useCallback((text: string, ms = 2600) => {
    window.clearTimeout(msgTimer.current);
    setMessage(text);
    setShowMsg(true);
    if (ms > 0) msgTimer.current = window.setTimeout(() => setShowMsg(false), ms);
  }, []);

  // first greeting fades away on its own
  useEffect(() => {
    msgTimer.current = window.setTimeout(() => {
      if (!touched.current) setShowMsg(false);
    }, 7000);
    return () => {
      window.clearTimeout(msgTimer.current);
      window.clearTimeout(happyTimer.current);
    };
  }, []);

  // idle life: irregular blinks and little head tilts (skipped for reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let blinkT: number;
    let tiltT: number;
    const blink = () => {
      const svg = svgRef.current;
      if (svg) {
        svg.dataset.blink = "true";
        window.setTimeout(() => {
          if (svgRef.current) svgRef.current.dataset.blink = "false";
        }, 140);
        // sometimes a quick double blink
        if (Math.random() < 0.25) {
          window.setTimeout(() => {
            if (svgRef.current) svgRef.current.dataset.blink = "true";
            window.setTimeout(() => {
              if (svgRef.current) svgRef.current.dataset.blink = "false";
            }, 130);
          }, 260);
        }
      }
      blinkT = window.setTimeout(blink, 2200 + Math.random() * 3800);
    };
    const tilt = () => {
      const svg = svgRef.current;
      if (svg && svg.dataset.mood !== "happy") {
        const r = Math.random();
        svg.dataset.tilt = r < 0.35 ? "left" : r < 0.7 ? "right" : "none";
      }
      tiltT = window.setTimeout(tilt, 2600 + Math.random() * 4200);
    };
    blinkT = window.setTimeout(blink, 1800);
    tiltT = window.setTimeout(tilt, 3000);
    return () => {
      window.clearTimeout(blinkT);
      window.clearTimeout(tiltT);
    };
  }, []);

  // look toward the cursor and perk the ears when it is near (fine pointers only)
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const svg = svgRef.current;
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.45;
      const dx = px - cx;
      const dy = py - cy;
      const lx = Math.max(-1, Math.min(1, dx / 320));
      const ly = Math.max(-1, Math.min(1, dy / 320));
      const eyes = svg.querySelector<SVGGElement>(".pup-eyes");
      if (eyes) eyes.style.transform = `translate(${(lx * 3.4).toFixed(2)}px, ${(ly * 2.6).toFixed(2)}px)`;
      svg.dataset.alert = Math.hypot(dx, dy) < 260 ? "true" : "false";
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // which section is on screen -> active state in the menu
  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  // close on Escape, or on a press anywhere outside the dock (no backdrop element needed)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const toggle = () => {
    touched.current = true;
    const next = !open;
    setOpen(next);
    setMood("happy", 1500);
    setBurst((b) => b + 1);
    say(next ? "Woof! Where shall we go?" : "See you soon!", 2800);
  };

  const onNavigate = () => {
    // a quick reaction; the browser follows the link immediately
    touched.current = true;
    setMood("happy", 900);
    setBurst((b) => b + 1);
    say("Off we go!", 1400);
    setOpen(false);
  };

  const onOrder = () => {
    touched.current = true;
    setMood("happy", 900);
    setOpen(false);
    setCartOpen(true);
  };

  return (
    <div ref={dockRef} className="pup-dock" data-open={open}>
      {/* speech bubble: decorative, never catches pointers */}
      <p className="pup-bubble" data-show={showMsg ? "true" : "false"} role="status" aria-live="polite">
        {message}
      </p>

      <button
        ref={buttonRef}
        type="button"
        className="pup-badge"
        onClick={toggle}
        onPointerEnter={() => {
          if (svgRef.current && svgRef.current.dataset.mood !== "happy") svgRef.current.dataset.hover = "true";
        }}
        onPointerLeave={() => {
          if (svgRef.current) svgRef.current.dataset.hover = "false";
        }}
        aria-expanded={open}
        aria-controls="puppy-menu"
        aria-label={open ? "Close navigation menu" : "Open navigation menu. The puppy will show you around"}
      >
        <Puppy ref={svgRef} className="pup-art" />

        {/* hearts and sparkles, replayed by changing the key */}
        <span className="pup-burst" key={burst} aria-hidden="true">
          {burst > 0 &&
            BURST.map((b, i) => (
              <span
                key={i}
                className={`pup-spark pup-${b.kind}`}
                style={{ ["--dx" as string]: `${b.dx}px`, ["--dy" as string]: `${b.dy}px`, animationDelay: `${b.delay}ms` }}
              />
            ))}
        </span>

        {cartCount > 0 && <span className="pup-count" aria-label={`${cartCount} in your order`}>{cartCount}</span>}
      </button>

      <nav id="puppy-menu" className="pup-panel" aria-label="Main" data-open={open}>
        <Poppy className="pup-poppy pup-poppy-a" />
        <Poppy className="pup-poppy pup-poppy-b" />
        <p className="pup-wordmark">Kaapi Katha</p>
        <ul>
          {ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={item.href}
                onClick={onNavigate}
                className="pup-item"
                data-active={active === item.id}
                aria-current={active === item.id ? "location" : undefined}
                tabIndex={open ? 0 : -1}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
          <li>
            <button type="button" onClick={onOrder} className="pup-item pup-item-button" tabIndex={open ? 0 : -1}>
              <Icon name="order" />
              <span>Your order{cartCount > 0 ? ` (${cartCount})` : ""}</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
