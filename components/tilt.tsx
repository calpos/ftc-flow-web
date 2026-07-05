"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { SETTLE_SPRING } from "@/lib/motion";

/**
 * Pointer-reactive tilt for the hero device: it leans a few degrees toward the
 * cursor, as if catching the backlight. A sanctioned departure from the
 * reveal-only rule, bounded to the hero artifact.
 *
 * Enabled only on fine pointers (mouse) at desktop widths. Touch, coarse
 * pointers, small viewports, and reduced motion all get a static device.
 */
export function Tilt({
  children,
  className,
  max = 6,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(mq.matches && window.innerWidth >= 1024);
    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [reduceMotion]);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), SETTLE_SPRING);
  const rotateX = useSpring(
    useTransform(py, [-0.5, 0.5], [max * 0.66, -max * 0.66]),
    SETTLE_SPRING,
  );

  if (reduceMotion || !enabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const reset = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ perspective: 1000 }}
      className={className}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
        {children}
      </motion.div>
    </div>
  );
}
