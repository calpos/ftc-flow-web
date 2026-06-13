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
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.05
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
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
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

**Key Characteristics:**
- Same world as the app: near-black tonal layers, 1px borders, one blue voice, Plex.
- Backlit, not decorated: glow exists only as a light source behind product imagery or the hero.
- Big type, plain words: hero display at clamp scale, copy that reads like a competent teammate.
- Motion as reveal: ease-out entrances that deliver content, never ambient animation.
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
**The One Voice Rule (inherited).** Signal Blue is the single voice. One primary CTA per viewport. If two blue elements compete, one is wrong.

**The Light Source Rule.** Glow is light, not paint. It may appear as a soft radial gradient behind a device frame, behind the hero composition, or as a faint tint bleeding from a section boundary; at most one glow per viewport. It never appears as text color, button glow, card shadow, or border effect.

**The No Pure Black Rule (inherited).** Darkest value #0A0A0F, lightest #F0F0F5. Every neutral tinted cool toward blue.

## 3. Typography

**Font:** IBM Plex Sans via `next/font/google`, weights 400 / 500 / 600. This is identity preservation: the app shipped on Plex, and the site is the app's world. The web adds weight 600, reserved for hero and display sizes where Medium 500 goes slack at large scale.

### Hierarchy
- **Hero** (600, clamp 2.5rem to 4.5rem, -0.03em): One per page, the opening statement.
- **Display** (600, clamp 2rem to 3rem, -0.02em): Section openers on long pages.
- **Headline** (500, clamp 1.5rem to 1.875rem): Feature section titles, card headers on /early-access.
- **Title** (500, 1.125rem): Sub-feature names, nav-level emphasis.
- **Body** (400, 1rem, line-height 1.65): Reading copy, capped at 65ch. Dark background, so line-height runs taller than the app's 1.4.
- **Label** (500, 0.75rem, +0.08em, uppercase): Kickers and timeline phase markers only. Used as deliberate section grammar on /roadmap; elsewhere at most once per page.

### Named Rules
**The Scale Jump Rule.** Adjacent hierarchy steps keep a ≥1.25 size ratio. The site's drama lives in the jump from Body to Hero; flattening the scale kills the register.

**The 600 Ceiling Rule.** Weight 600 exists only at Display size and above. Body and Title never exceed 500; bold body copy reads as shouting in this voice.

## 4. Elevation & Light

Flat tonal layering inherited from the app: canvas → Surface → Surface Raised, separated by 1px Border hairlines. No box-shadows on cards, buttons, or inputs.

The website's single sanctioned departure is the **backlight**: a radial Signal Blue Glow positioned behind product imagery (device frames, screenshot clusters) or behind the hero. It is rendered as a background gradient on a positioned layer, never as `box-shadow` or `filter: drop-shadow` on the element itself.

### Named Rules
**The Flat-By-Default Rule (inherited, amended).** Raise an element by stepping its tone and adding a hairline. The backlight is the only glow, it lives behind things, and there is at most one per viewport.

## 5. Components

### Buttons
- **Primary:** Signal Blue fill, Near-Black Ink text, 10px radius, 14px/24px padding. Hover: brightens slightly (e.g. ~8% lighter), 150ms ease-out. No scale, no glow, no shadow.
- **Secondary:** Surface Raised fill, Text Primary, 1px Border. Hover: border shifts toward Signal Blue Dim, text stays.
- **Disabled (early-access placeholder):** Surface fill, Text Tertiary, 1px Border, `cursor: not-allowed`, labeled honestly ("Coming soon").

### Device Frame (signature)
The site's hero artifact: a phone-shaped shell (Surface fill, 1px Border, ~36px outer radius, 10px padding) wrapping a `next/image` screenshot with ~28px inner radius. Sits above its backlight glow. Screenshots are real app captures at 904×1871; the frame never crops or distorts them.

### Section (rhythm)
Pages are vertical sequences of full-width sections on the Ink canvas, `clamp(5rem, 10vw, 9rem)` vertical padding, content capped at a 72rem container. Feature sections alternate text/device sides on desktop and stack device-below-text on mobile. Depth between sections comes from an occasional Surface band, not dividers everywhere.

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
- **Scroll-progress line:** a 2px Signal-Blue bar at the top of the viewport, `scaleX` bound to page scroll. (`components/scroll-progress.tsx`)
- **Roadmap spine draw:** a Signal-Blue line fills downward over the gray hairline, `scaleY` bound to the list's scroll progress; nodes pop in on entry. (`components/timeline.tsx`)
- **Page transition:** routes fade + rise 8px in, keyed on pathname, enter-only (no blocking exit). (`components/page-transition.tsx`)
- **Micro:** hovers and focus at 150–200ms ease-out (link arrow nudge, card border tint toward Signal Blue Dim). No bounce, no elastic, no infinite loops, no parallax depth stacks. Buttons stay color-only on hover.
- **Reduced motion:** `prefers-reduced-motion` collapses everything to static: reveals instant, scroll-links and the spine fully drawn/lit, the progress bar and breathing canvas absent (static `.backlight` fallback), tilt off, page transition off, CSS transitions neutralized in `globals.css`. This is a hard requirement, not a nice-to-have.

### Named Rules
**The Delivery Rule.** Every animation delivers content into view or acknowledges input, with exactly two sanctioned exceptions below. Ambient motion (floating orbs, drifting gradients, marquee strips) is otherwise banned.

**The Living Light Exception.** Behind the hero device, the single backlight may be a slow breathing canvas glow (intensity + radius oscillating on an ~8s sine with a few px of drift; `components/backlight-canvas.tsx`). It is a light source, not decoration: one per viewport, behind real imagery, never paint/text/border. Reduced motion or no-canvas falls back to the static `.backlight`.

**The Hero Tilt Exception.** The hero device may lean a few degrees toward the cursor (`rotateX ±4°` / `rotateY ±6°`, spring-settled; `components/tilt.tsx`), as if catching the backlight. Bounded to the hero artifact and to fine pointers at desktop widths; touch, coarse pointers, small viewports, and reduced motion get a static device.

These two exceptions are deliberate and bounded. They do not license general ambient motion elsewhere; new effects still answer to the Delivery Rule.

## 7. Do's and Don'ts

### Do:
- **Do** put a real screenshot in every selling section; the screenshots are the argument.
- **Do** keep one glow per viewport, always behind product imagery or the hero.
- **Do** let the hero type get genuinely large; the scale jump is the cinematic register.
- **Do** label pre-launch states honestly (disabled buttons say "Coming soon").
- **Do** keep copy plain and direct, like a competent teammate.

### Don't:
- **Don't** use gradient text or `background-clip: text` anywhere, ever.
- **Don't** put box-shadow or drop-shadow glow on buttons, cards, or text.
- **Don't** invent stats, testimonials, or adoption numbers.
- **Don't** ship the corporate landing template: hero metric, logo wall, identical icon-card grids.
- **Don't** use pure #000 or #fff, colored side-stripes, or nested cards.
- **Don't** animate anything the user didn't scroll to or interact with, except the two sanctioned light-source exceptions in §6 (the breathing hero backlight and hero tilt).
