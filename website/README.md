# ThangGo — 3D scroll-animated website

The web companion / landing experience for the ThangGo mobile app. A scroll-driven,
cinematic marketing site where the 3D centerpiece, camera and UI all react to scroll.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **React Three Fiber** + **drei** — the persistent 3D scene
- **GSAP** + **ScrollTrigger** — pinned, scrubbed scroll timelines
- **Lenis** — smooth scroll, RAF-synced with GSAP (`gsap.ticker` drives `lenis.raf`)
- **Tailwind CSS** — layout/styling
- **Framer Motion** — UI micro-interactions (magnetic buttons, nav, hover tilt, parallax)

## Run it

```bash
cd website
npm install
npm run dev        # http://localhost:3000
```

Build for production:

```bash
npm run build && npm start
```

## The scroll story

Hero → Intro → **SP** → **GP** → **WILD** (each pinned) → App showcase → Stats → Download CTA → Footer.

`SP / GP / WILD` are ThangGo's three modes:

| Code | Mode       | What it is                                            |
| ---- | ---------- | ----------------------------------------------------- |
| SP   | Solo Play  | Book a court / gym slot / session, solo.              |
| GP   | Group Play | Build a squad, run tactics, book as a team.           |
| WILD | Wildcard   | Post a challenge, find an opponent, join open matches.|

## Where to edit (everything is centralized)

Open **`lib/theme.ts`** — it holds all the editable content:

- `BRAND` — name, **tagline**, **store links** (`appStoreUrl`, `playStoreUrl`), location
- `MODES` — the SP/GP/WILD **copy, features and accent colors**
- `STATS` — the count-up social-proof numbers
- `SHOWCASE` — the app feature highlights
- `NAV_LINKS` — nav items

### Add real app screenshots

1. Drop images in `website/public/screens/` (e.g. `home.png`).
2. In `components/AppShowcase.tsx`, pass `src="/screens/home.png"` to each `<PhoneMock />`.
   (Without `src` they render labelled gradient placeholders.)

### Replace the QR code

In `components/DownloadCTA.tsx` the QR is a placeholder grid — swap it for a real QR
image (`<img src="/qr.png" />`) pointing at your store/landing link.

## How the pieces fit

- `components/SmoothScroll.tsx` — Lenis ↔ GSAP wiring + publishes page progress to `lib/scrollState.ts`.
- `components/CanvasHost.tsx` → `Scene3D.tsx` — the fixed, lazy-loaded (`ssr:false`) 3D
  canvas. The centerpiece reads `scrollState` in `useFrame` to rotate, dolly the camera
  and recolor per mode.
- `lib/useScrollAnimation.ts` — shared `usePinnedSection()` / `useReveal()` hooks every
  section uses, so the scroll pattern is consistent and reduced-motion-safe.

## Performance & accessibility

- 3D canvas is dynamically imported (`ssr:false`) with a poster fallback — no layout shift.
- Geometry + particle counts drop on screens `< 768px`; `dpr` is capped at `[1, 2]`.
- `prefers-reduced-motion`: smooth scroll, pinning, scrubbing and parallax are disabled;
  sections fall back to clean static fade-ins and counters snap to final values.

> Placeholders are marked with `[REPLACE]` comments throughout — search for them to
> find every spot that wants your real content/assets.
