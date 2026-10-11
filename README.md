# Kaapi Katha — A Little More India in Every Pour

An interactive 3D web experience for an imagined Indian filter-coffee café.
Concept, design and development by **Pratik Prashant Kolhe**.

> Kaapi Katha is a fictional café concept made as a creative coding project.
> It is not a real business and is not affiliated with any existing brand.
> Photographs under `public/images/coffee` are placeholders.

## What's inside

- **Real-time 3D hero** — a steel tumbler and brass davara, modelled
  procedurally (lathe geometry, PBR metals, procedural studio reflections),
  with drifting coffee beans at several depths, steam, and soft shadows.
- **Scroll-driven camera** — wide shot → leaning in → looking down into the foam,
  with the key light sliding across the steel as you scroll.
- **Cursor parallax** — eased tilt of the product and depth-based bean motion.
- **Projected hotspots** — three tappable notes anchored to points in 3D space.
- **Build-your-cup** — a live SVG cup preview with rupee pricing and a cart drawer
  with a demo checkout (no payment is taken).
- **Graceful fallbacks** — a still illustration when WebGL is unavailable or the
  context is lost; `prefers-reduced-motion` stops idle and cursor motion;
  rendering pauses when the hero is off-screen; fewer beans and a lower pixel
  ratio on phones.

## Stack

Next.js 16 · React 19 · Tailwind CSS v4 · three.js + @react-three/fiber ·
Framer Motion · Lenis · TypeScript. Type is Fraunces, Inter, Space Mono and
Noto Serif Devanagari via `next/font`.

## Getting started

```bash
npm install
npm run dev
```

```bash
npm run build && npm start
```

## Project layout

| Path | What it is |
| --- | --- |
| `src/components/HeroScene.tsx` | The WebGL scene (tumbler, davara, beans, steam, camera rig) |
| `src/components/HeroCanvas.tsx` | Hero section: headline, hotspots overlay, fallback logic |
| `src/data/*.ts` | Menu, gallery and ritual copy |
| `src/context/CartContext.tsx` | Cart state and toasts |

## Credits

Concept, design and development by Pratik Prashant Kolhe.
This project originally began as a Starbucks-themed animated landing page by
other contributors (see the Git history); it has since been re-themed and the
hero rebuilt as a procedural 3D scene.
