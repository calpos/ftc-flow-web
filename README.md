# FTC Flow Website

Marketing site for [FTC Flow](https://ftcflow.app), a calm coordination app for FIRST Tech Challenge teams. The app is pre-launch (TestFlight beta summer 2026, App Store fall 2026); this site is advertising only. No app features, no real auth.

## Stack

- Next.js 16 (App Router, Turbopack), TypeScript strict
- Tailwind CSS v4 (theme tokens in `app/globals.css`)
- Motion (Framer Motion) for scroll reveals, with `prefers-reduced-motion` support
- IBM Plex Sans via `next/font/google`
- Package manager: bun
- Deploy target: Vercel

## Development

```bash
bun install
bun dev          # http://localhost:3000
bun run lint     # ESLint
bun run build    # production build
```

## Structure

- `app/` routes: `/` (landing), `/features`, `/roadmap`, `/about`, `/early-access`
- `app/api/subscribe/route.ts` stubbed mailing-list endpoint (returns 200; see TODO to wire a real provider)
- `app/opengraph-image.tsx`, `app/icon.tsx`, `app/apple-icon.tsx` OG image and favicons generated at build time from `public/logo.png`
- `components/` nav, footer, hero, scroll reveal, phone device frame, subscribe form
- `lib/screenshots.ts` manifest of app screenshots in `public/screenshots/` with dimensions and alt text
- `PRODUCT.md` / `DESIGN.md` the site's design context (brand, palette, type scale, motion rules)

## Design notes

The visual system inherits the app's "Quiet Console" brand: near-black tonal layers (`#0a0a0f` / `#14141c` / `#1e1e2a`), 1px `#1c1c28` hairlines, a single Signal Blue `#2d8cff` accent, and IBM Plex Sans. The site adds what the app forbids itself: large display type, scroll reveals, and one radial blue glow per viewport, always behind product imagery. No gradient text, no box-shadow elevation, no fake stats or testimonials.
