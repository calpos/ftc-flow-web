/**
 * Single source of truth for the site's motion tokens, mirroring the `motion`
 * block in DESIGN.md. The site's curve is the ease-out-quint family; nothing
 * bounces, nothing loops, every motion delivers content or backlights imagery.
 */

/** ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1) */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Entrance rise distance in px. */
export const REVEAL_DISTANCE = 24;

/** Reveal duration in seconds. */
export const REVEAL_DURATION = 0.6;

/** Stagger between revealed children, in seconds. */
export const STAGGER = 0.09;

/** Settle spring for scroll-linked and pointer-linked values. */
export const SETTLE_SPRING = { stiffness: 120, damping: 24, mass: 0.6 } as const;
