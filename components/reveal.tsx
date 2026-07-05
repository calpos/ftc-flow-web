"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE, REVEAL_DISTANCE, REVEAL_DURATION } from "@/lib/motion";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

/**
 * Scroll-entrance reveal: 24px rise + fade, once, ease-out-quint.
 * Collapses to a static element when the user prefers reduced motion.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: REVEAL_DISTANCE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: REVEAL_DURATION, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
