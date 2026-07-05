"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Spotlight: a cell that acknowledges the cursor. As the pointer moves over
 * it, a soft interior light and a border brightening follow the cursor
 * position (CSS pseudo layers in globals.css driven by --x/--y), and the
 * cell leans a few pixels toward the pointer. Input acknowledgment under
 * the Delivery Rule; static on touch, coarse pointers, and reduced motion.
 */

type SpotlightProps = {
  children: ReactNode;
  className?: string;
  /** Max lean toward the cursor in px; 0 disables the parallax. */
  parallax?: number;
};

export function Spotlight({ children, className, parallax = 4 }: SpotlightProps) {
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

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    node.style.setProperty("--x", `${x}px`);
    node.style.setProperty("--y", `${y}px`);
    if (parallax > 0) {
      const dx = (x / rect.width - 0.5) * 2 * parallax;
      const dy = (y / rect.height - 0.5) * 2 * parallax;
      node.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    }
  };

  const reset = () => {
    const node = ref.current;
    if (!node) return;
    node.style.transform = "";
  };

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      className={`spotlight transition-transform duration-300 ease-out ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
