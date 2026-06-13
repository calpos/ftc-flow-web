"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion";

/**
 * Cross-page entrance: each route fades and rises in, keyed on pathname so the
 * new page remounts and plays its entrance. Enter-only (no blocking exit) to
 * avoid the scroll-jump and flash that mode="wait" causes on the App Router.
 *
 * Reduced motion: renders children straight through.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
