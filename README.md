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
- **Build Your Cup, as a live preparation.** The preview panel has its own
  scene: espresso pulls from a group head, milk pours from a tilting pitcher,
  syrup drips in one pulse per pump, toppings land, and steam rises when the
  drink is served. Streams are stretched between their source and the *current*
  liquid surface, so they always connect. Every stage is a pure function of a
  playhead, so it can be replayed and is driven by the shots, milk, syrup and
  toppings you choose.
- **One price calculation.** `src/lib/builderConfig.ts` owns the options, the
  price breakdown and the cart id, so the controls, 3D scene and cart agree. The
  same recipe merges into one cart line and carries its configuration.
- **Demo checkout:** no payment is taken.
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
| `src/components/CupScene.tsx` | Page-wide scroll-keyframe rig for the travelling cup |
| `src/components/CupModel.tsx` | Shared ceramic cup, saucer, liquid surface, studio lighting |
| `src/components/BuilderScene.tsx` | The preparation sequence in the Build Your Cup panel |
| `src/lib/builderConfig.ts` | Options, pricing, cart id for the cup builder |
| `src/components/CupStage.tsx` | Fixed canvas host, WebGL detection, error boundary |
| `src/components/HeroCanvas.tsx` | Hero section: headline and static fallback |
| `src/lib/cupStore.ts` | Non-reactive bridge between the cup builder and the scene |
| `src/data/*.ts` | Menu and gallery content |
| `src/context/CartContext.tsx` | Cart state and toasts |

## Credits

Concept, design and development by Pratik Prashant Kolhe.
This project originally began as a Starbucks-themed animated landing page by
other contributors (see the Git history); it has since been re-themed and the
hero rebuilt as a procedural 3D scene.
