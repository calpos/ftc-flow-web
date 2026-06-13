"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { SETTLE_SPRING } from "@/lib/motion";

type RevealPhoneProps = {
  children: ReactNode;
  /** Sizing + positioning for the phone well (sets the scroll target). */
  className?: string;
  /** Layout for the content wrapper, e.g. flex for a two-phone cluster. */
  contentClassName?: string;
  /** Inset for the backlight glow behind the imagery. */
  glowClassName?: string;
};

/**
 * Scroll-linked product reveal: as the device enters the viewport it rises,
 * settles up to full scale, and its backlight glow brightens from dark to lit,
 * so the console literally lights up as you reach it. The glow is the existing
 * `.backlight` light source (one per viewport, behind imagery); only its
 * opacity is driven, never a new glow.
 *
 * Reduced motion: static, fully lit, no transforms.
 */
export function RevealPhone({
  children,
  className,
  contentClassName,
  glowClassName = "-inset-[18%]",
}: RevealPhoneProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.45"],
  });

  const yRaw = useTransform(scrollYProgress, [0, 1], [28, 0]);
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [0.95, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [0.4, 1]);
  const glow = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const y = useSpring(yRaw, SETTLE_SPRING);
  const scale = useSpring(scaleRaw, SETTLE_SPRING);

  if (reduceMotion) {
    return (
      <div className={`relative isolate ${className ?? ""}`}>
        <div aria-hidden className={`backlight absolute -z-10 ${glowClassName}`} />
        <div className={contentClassName}>{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative isolate ${className ?? ""}`}>
      <motion.div
        aria-hidden
        style={{ opacity: glow }}
        className={`backlight absolute -z-10 ${glowClassName}`}
      />
      <motion.div style={{ y, scale, opacity }} className={contentClassName}>
        {children}
      </motion.div>
    </div>
  );
}
