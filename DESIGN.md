---
name: FTC Flow Website
description: The cinematic web face of The Quiet Console. Same near-black world as the app, with the lights turned up.
colors:
  signal-blue: "#2D8CFF"
  signal-blue-dim: "#1A3A5C"
  signal-blue-glow: "rgba(45, 140, 255, 0.14)"
  near-black-ink: "#0A0A0F"
  surface: "#14141C"
  surface-raised: "#1E1E2A"
  border: "#1C1C28"
  text-primary: "#F0F0F5"
  text-secondary: "#A0A0B0"
  text-tertiary: "#85869A"
  status-success: "#34C759"
  status-warning: "#FF9F0A"
  status-danger: "#FF453A"
typography:
  hero:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(2.75rem, 6.5vw, 5rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  display:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(1.5rem, 2.5vw, 1.875rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "24px"
motion:
  duration-reveal: "0.6s"
  duration-micro: "0.15s"
  ease: "cubic-bezier(0.22, 1, 0.36, 1)"
  stagger: "0.09s"
  reveal-distance: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.near-black-ink}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "14px 24px"
  device-frame:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.border}"
    rounded: "36px"
    padding: "10px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: FTC Flow Website

## 1. Overview

**Creative North Star: "The Console, Backlit"**

The website lives in the same near-black world as the app, but it has a different job. The app is a quiet tool a student checks for fifteen seconds; the site is a pitch that has to earn a forward. So the site keeps the app's discipline (three tonal layers, 1px hairlines, one blue voice, IBM Plex Sans) and adds what the app forbids itself: scale, light, and motion. Display type gets large. Sections reveal as you scroll. And Signal Blue, which in the app is only ever paint, is allowed on the web to behave like a light source: a soft radial glow rising behind a phone, a faint tint bleeding off a section edge.

The discipline is what keeps the cinema from becoming slop. Every glow backlights a real screenshot. Every reveal delivers a real screen. The palette never grows; the blue never becomes a gradient ramp or a text fill; the neutrals stay cool and blue-tinted. A visitor should feel they are looking at the app's world from outside, at night, with the console glowing.

The 2026 "turned up" revision added two layers without changing the world: **light got an engine** (a WebGL light field behind the hero, with a documented fallback ladder) and **the void got a chassis** (the Substrate: faint engineering grid, film grain, hairline section rules, and a mono detail voice). The darkness now reads as designed structure, not empty space.

**Key Characteristics:**
- Same world as the app: near-black tonal layers, 1px borders, one blue voice, Plex.
- Backlit, not decorated: light behaves as light sources behind or around product imagery.
- Structured, not empty: the Substrate (grid, grain, hairlines, mono details) fills the void quietly.
- Big type, plain words: hero display at clamp scale, copy that reads like a competent teammate.
- Motion as delivery: entrances and scroll choreography that bring real screens into view.
- Honest pre-launch surfaces: disabled states say "coming soon" and mean it.

## 2. Colors

Inherited wholesale from the app's Quiet Console palette. The website adds exactly one thing: a glow alpha of Signal Blue. Nothing else is new.

### Primary
- **Signal Blue** (#2D8CFF): Primary CTAs, active nav state, key links, the rare inline emphasis. The single voice.
- **Signal Blue Dim** (#1A3A5C): Selected/tag fills, timeline markers, subtle interactive tints.
- **Signal Blue Glow** (rgba(45,140,255,0.14)): The web-only addition. Radial gradients backlighting device frames and the hero. Never a fill, never a border, never text.

### Status
- **Success Green** (#34C759), **Warning Amber** (#FF9F0A), **Danger Red** (#FF453A): On the website these appear only when depicting real app semantics (e.g. a roadmap "shipped" marker, status language in feature copy). Never decorative.

### Neutral
- **Near-Black Ink** (#0A0A0F) canvas → **Surface** (#14141C) → **Surface Raised** (#1E1E2A), separated by **Border** (#1C1C28) hairlines. **Text Primary** (#F0F0F5) / **Secondary** (#A0A0B0) / **Tertiary** (#85869A).

### Named Rules
**The One Voice Rule (inherited).** Signal Blue is the single voice. One primary CTA per viewport. If two blue elements compete, one is wrong. The rotating hero word is the sanctioned inline emphasis.

**The Light Source Rule 2.0.** Glow is light, not paint. Each viewport has at most one **dominant** light (the hero light field, a device backlight, the CTA glow); dim supporting bleeds (`.bleed-top` / `.bleed-bottom`, 3–7% alpha washes at section boundaries) may accompany it. Light never appears as text color, button glow, card shadow, or border effect.

**The No Pure Black Rule (inherited).** Darkest value #0A0A0F, lightest #F0F0F5. Every neutral tinted cool toward blue.

## 3. Typography

**Fonts:** IBM Plex Sans via `next/font/google`, weights 400 / 500 / 600, plus **IBM Plex Mono** 400 / 500 as the Detail Voice. This is identity preservation: the app shipped on Plex, and the site is the app's world. The web adds weight 600, reserved for hero and display sizes where Medium 500 goes slack at large scale.

**The Detail Voice (Plex Mono).** Mono is the engineering annotation layer: kickers, step indices (`01`–`04`), timeline phase labels, form labels, footer meta, launch-date lines (`lib/ui.ts` `monoLabel`: 0.75rem, 500, +0.14em, uppercase). It never sets body copy, headings, or buttons; a surface with more than two mono moments in view is over-annotated.

### Hierarchy
- **Hero** (600, clamp 2.5rem to 4.5rem, -0.03em): One per page, the opening statement.
- **Display** (600, clamp 2rem to 3rem, -0.02em): Section openers on long pages.
- **Headline** (500, clamp 1.5rem to 1.875rem): Feature section titles, card headers on /early-access.
- **Title** (500, 1.125rem): Sub-feature names, nav-level emphasis.
- **Body** (400, 1rem, line-height 1.65): Reading copy, capped at 65ch. Dark background, so line-height runs taller than the app's 1.4.
- **Label** (Plex Mono, 500, 0.75rem, +0.14em, uppercase): the Detail Voice. Kickers, indices, phase markers, form labels, meta lines. Deliberate section grammar sitewide, but small doses per viewport.

### Named Rules
**The Scale Jump Rule.** Adjacent hierarchy steps keep a ≥1.25 size ratio. The site's drama lives in the jump from Body to Hero; flattening the scale kills the register.

**The 600 Ceiling Rule.** Weight 600 exists only at Display size and above. Body and Title never exceed 500; bold body copy reads as shouting in this voice.

## 4. Elevation & Light

Flat tonal layering inherited from the app: canvas → Surface → Surface Raised, separated by 1px Border hairlines. No box-shadows on cards, buttons, or inputs.

Light comes in three sanctioned forms, all rendered behind or around content, never as `box-shadow` or `filter: drop-shadow` on the element itself:

- **The light field** (`components/light-field.tsx`): the hero's WebGL light source. See §6, Living Light 2.0.
- **The backlight** (`.backlight`): a radial Signal Blue Glow behind product imagery (device frames, screenshot clusters) or a CTA composition. The dominant light of most viewports.
- **Bleeds** (`.bleed-top` / `.bleed-bottom`): dim washes softening section boundaries. Supporting light only.

### The Substrate

The console's chassis (`components/substrate.tsx` + `globals.css`). Three static, aria-hidden texture layers that keep the Ink canvas from reading as an empty void:

- **Engineering grid** (`.substrate-grid` + fade/top masks, `GridLayer`): 1px lines on a 56px module at ~5% cool alpha, always masked so it dissolves under content. Hero, section headers, footer, text bento cells.
- **Film grain** (`.grain`, `Grain`): SVG turbulence tiled at 3.5% opacity, fixed over the whole page, above content, below nothing interactive.
- **Section rules** (`SectionRule`): full-width hairlines with mono `+` ticks where they cross the content container. The home page's section punctuation.

The Substrate is structure, not decoration: quiet enough to miss, missed when gone. It never animates.

### Named Rules
**The Flat-By-Default Rule (inherited, amended).** Raise an element by stepping its tone and adding a hairline. Light lives behind things; one dominant light per viewport with dim bleeds in support. The Substrate is the only permitted texture, and it stays still.

## 5. Components

### Buttons
- **Primary:** Signal Blue fill, Near-Black Ink text, 10px radius, 14px/24px padding. Hover: brightens slightly (e.g. ~8% lighter), 150ms ease-out. No scale, no glow, no shadow.
- **Secondary:** Surface Raised fill, Text Primary, 1px Border. Hover: border shifts toward Signal Blue Dim, text stays.
- **Disabled (early-access placeholder):** Surface fill, Text Tertiary, 1px Border, `cursor: not-allowed`, labeled honestly ("Coming soon").

### Device Frame (signature)
The site's hero artifact: a phone-shaped shell (Surface fill, 1px Border, ~36px outer radius, 10px padding) wrapping a `next/image` screenshot with ~28px inner radius. Sits above its backlight glow. Screenshots are real app captures at 904×1871; the frame never crops or distorts them.

### Section (rhythm)
Pages are vertical sequences of full-width sections on the Ink canvas, `clamp(5rem, 10vw, 9rem)` vertical padding, content capped at a 72rem container. The home page runs three distinct rhythms (walkthrough → bento → CTA) punctuated by SectionRules; /features alternates text/device sides. Depth between sections comes from bleeds and rules, not dividers everywhere.

### Walkthrough (home signature)
`components/walkthrough.tsx`. The device frame pins to the viewport (CSS sticky) while four steps scroll past on a spine rail; the screen crossfades to match the active step (IntersectionObserver center band). Step grammar: mono index → headline → body, inactive steps at 30% opacity, a Signal Blue spine filling with progress. Small viewports and reduced motion get the stacked version: alternating text/device sections, no pinning.

### Bento (home secondary)
`components/bento.tsx`. Varied cells on a 12-column grid, never identical: screenshot-crop cells (Surface fill, hairline, mono label + title + one line, bottom-masked crop, hover border tint + 1.025 image scale) and text cells (grid-textured, display type, arrow link). No shadows, no glow, no nested cards.

### Nav
Sticky, Ink at ~80% opacity with backdrop blur (the one sanctioned blur: it is functional, keeping the sticky bar legible over scrolling content), 1px bottom Border hairline. Logo left; Features / Roadmap / About center-right; Get Early Access as the primary button. Active page link in Signal Blue. Mobile: hamburger to full-width panel on Surface.

### Timeline (/roadmap)
Vertical spine: 1px Border line, nodes as small circles. Current phase node in Signal Blue with a Signal Blue Dim ring; shipped items may use Success Green markers; future phases use Border-toned nodes with Text Tertiary labels. Phase labels in Label type.

### Inputs (/early-access)
Surface Raised fill, 10px radius, 1px Border; focus shifts border to Signal Blue plus a visible focus ring for keyboard users. Error state: Danger Red border + plain-language message. Success state replaces the form with a confirmation line, no confetti.

## 6. Motion

Motion is reveal choreography, with two named light-source exceptions (below). Library: Framer Motion (`motion` package). Tokens centralize in `lib/motion.ts`.

- **Entrance reveals:** `whileInView`, once only, 24px rise + fade, 0.6s, ease `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint family). Staggered children at 90ms.
- **Scroll-linked product reveals:** device frames are bound to their own scroll progress (`useScroll` target + offset), rising 28→0px and scaling 0.95→1 on a settle spring while their backlight glow brightens 0→1 opacity, so the console lights up as it enters view. The glow is the existing `.backlight` light source, opacity-driven only. (`components/reveal-phone.tsx`)
- **Hero:** one orchestrated load sequence (kicker → headline words, staggered → subhead → CTAs → device), same curve, total under 1.2s.
- **Rotating hero word:** the headline's closing word rolls vertically (exit up, enter from below) every 2.6s (`components/rotating-word.tsx`, tokens `ROTATE_HOLD` / `ROTATE_DURATION`). Width is reserved by an invisible sizer so the line never reflows; rotation pauses on hidden tabs; reduced motion renders the static closing phrase.
- **Walkthrough choreography:** the pinned device crossfades screens (0.45s, opacity + 10px rise) as the active step changes; step text animates 0.3→1 opacity; the spine fills stepwise. All driven by the center-band IntersectionObserver, not raw scroll position, so it settles instead of scrubbing.
- **Scroll-progress line:** a 2px Signal-Blue bar at the top of the viewport, `scaleX` bound to page scroll. (`components/scroll-progress.tsx`)
- **Roadmap spine draw:** a Signal-Blue line fills downward over the gray hairline, `scaleY` bound to the list's scroll progress; nodes pop in on entry. (`components/timeline.tsx`)
- **Page transition:** routes fade + rise 8px in, keyed on pathname, enter-only (no blocking exit). (`components/page-transition.tsx`)
- **Micro:** hovers and focus at 150–200ms ease-out (link arrow nudge, card border tint toward Signal Blue Dim). No bounce, no elastic, no infinite loops, no parallax depth stacks. Buttons stay color-only on hover.
- **Reduced motion:** `prefers-reduced-motion` collapses everything to static: reveals instant, scroll-links and the spine fully drawn/lit, the progress bar and breathing canvas absent (static `.backlight` fallback), tilt off, page transition off, CSS transitions neutralized in `globals.css`. This is a hard requirement, not a nice-to-have.

### Named Rules
**The Delivery Rule.** Every animation delivers content into view or acknowledges input, with exactly two sanctioned exceptions below. Ambient motion (floating orbs, drifting gradients, marquee strips) is otherwise banned.

**The Living Light Exception 2.0.** The hero's dominant light is a WebGL light field (`components/light-field.tsx`): two or three Signal-Blue sources drifting on slow offset periods (~20s+) through a faint noise field, dithered against banding, with a small pointer parallax on fine pointers. Wattage stays low (peak ~0.2 alpha): it is a light source, not decoration — one dominant light per viewport, behind real content, never paint/text/border. Engineering guardrails: single draw call, DPR capped at 1.5, rAF paused offscreen and on hidden tabs, `powerPreference: "low-power"`.

**The fallback ladder** (in priority order):
1. **WebGL light field** — the shipping default.
2. **Canvas-2D breathing glow** (`components/backlight-canvas.tsx`, the original Living Light: ~8s sine breathing + drift) — automatic runtime fallback when WebGL is unavailable or the context is lost. *If real-hardware testing (school Chromebooks) shows the WebGL tier lagging, this tier is the designated replacement primary: swap by rendering `BacklightCanvas` where `LightField` mounts today.*
3. **Static `.backlight`** — reduced motion, or no canvas at all. Always honest, always lit.

**The Hero Tilt Exception.** The hero device may lean a few degrees toward the cursor (`rotateX ±4°` / `rotateY ±6°`, spring-settled; `components/tilt.tsx`), as if catching the backlight, plus a 1.5° resting tilt at desktop widths. Bounded to the hero artifact and to fine pointers at desktop widths; touch, coarse pointers, small viewports, and reduced motion get a static device.

These two exceptions are deliberate and bounded. They do not license general ambient motion elsewhere; new effects still answer to the Delivery Rule. The Substrate never animates.

## 7. Do's and Don'ts

### Do:
- **Do** put a real screenshot in every selling section; the screenshots are the argument.
- **Do** keep one dominant light per viewport, always behind product imagery or the hero; bleeds stay dim and supporting.
- **Do** let the hero type get genuinely large; the scale jump is the cinematic register.
- **Do** ground empty stretches with the Substrate (grid, grain, rules) instead of leaving flat voids.
- **Do** label pre-launch states honestly (disabled buttons say "Coming soon").
- **Do** keep copy plain and direct, like a competent teammate.

### Don't:
- **Don't** use gradient text or `background-clip: text` anywhere, ever.
- **Don't** put box-shadow or drop-shadow glow on buttons, cards, or text.
- **Don't** invent stats, testimonials, or adoption numbers.
- **Don't** ship the corporate landing template: hero metric, logo wall, identical icon-card grids.
- **Don't** use pure #000 or #fff, colored side-stripes, or nested cards.
- **Don't** set body copy, headings, or buttons in Plex Mono; the Detail Voice is labels and indices only.
- **Don't** animate anything the user didn't scroll to or interact with, except the two sanctioned light-source exceptions in §6 (the hero light field and hero tilt) and the rotating hero word.
