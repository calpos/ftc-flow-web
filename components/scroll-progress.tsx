"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * A 2px Signal-Blue line pinned to the very top of the viewport, scaling with
 * page scroll. The single voice, used as a quiet progress signal. Bound to a
 * motion value directly so scrolling never triggers a React render.
 *
 * Reduced motion: renders nothing (the bar exists only to express motion).
 */
export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 32,
    mass: 0.4,
  });

  if (reduceMotion) {
    return null;
  }

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-signal"
    />
  );
}
