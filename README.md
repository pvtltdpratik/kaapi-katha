# Kaapi Katha — A Little More India in Every Pour

An interactive 3D web experience for an imagined Indian filter-coffee café.
Concept, design and development by **Pratik Prashant Kolhe**.

> Kaapi Katha is a fictional café concept made as a creative coding project.
> It is not a real business and is not affiliated with any existing brand.
> Photographs under `public/images/coffee` are placeholders.

## What's inside

- **One cup that travels the page.** A single fixed WebGL canvas holds a
  procedural ceramic cup (lathe-turned body, swept handle, latte-art crema).
  Its position, scale, lean and spin are written every frame from
  `window.scrollY`, so it moves exactly as fast as the reader scrolls.
- **A path measured from the layout.** Keyframes are anchored to real DOM
  sections (`CupScene.tsx`), so the cup zig-zags into the free lane opposite
  each block of text and never needs hard-coded pixel positions.
- **Live preview.** In *Build Your Cup* the cup lands in the preview slot and
  responds to size and milk choices.
- **Build-your-cup and cart** with rupee pricing and a demo checkout (no payment
  is taken).
- **Fallbacks.** A still SVG cup when WebGL is unavailable or the context is
  lost; `prefers-reduced-motion` removes idle motion and damping; phones and
  tablets use a simpler path (hero, then the customizer preview).

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
| `src/components/CupScene.tsx` | The cup, lighting and the scroll-keyframe rig |
| `src/components/CupStage.tsx` | Fixed canvas host, WebGL detection, error boundary |
| `src/components/HeroCanvas.tsx` | Hero section: headline and static fallback |
| `src/lib/cupStore.ts` | Non-reactive bridge between the cup builder and the scene |
| `src/data/*.ts` | Menu, gallery and ritual copy |
| `src/context/CartContext.tsx` | Cart state and toasts |

## Credits

Concept, design and development by Pratik Prashant Kolhe.
This project originally began as a Starbucks-themed animated landing page by
other contributors (see the Git history); it has since been re-themed and the
hero rebuilt as a procedural 3D scene.
