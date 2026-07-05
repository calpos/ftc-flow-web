"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The Cursor Light: the visitor carries a light through the console.
 * Two fixed, pointer-events-none layers driven by one pointer listener:
 *
 * - Glow wash: a dim Signal-Blue radial that trails the cursor with a
 *   spring lag, like the backlight leaning toward you.
 * - Grid reveal: a brighter copy of the substrate grid, masked to a
 *   radius around the cursor, so moving the mouse feels like a flashlight
 *   finding the console's chassis in the dark. It renders at negative z,
 *   behind all content: the reveal lives only in the dark voids, never
 *   over the nav, cards, or device frames. Alignment with the section
 *   grids comes from the shared background-attachment: fixed origin.
 *
 * Both are input acknowledgment under the Delivery Rule. Fine pointers at
 * desktop widths only; touch, coarse pointers, and reduced motion render
 * nothing. Layers fade out when the pointer leaves the window.
 */
export function CursorLight() {
  const reduceMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const washRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!enabled) return;
    const wash = washRef.current;
    const grid = gridRef.current;
    if (!wash || !grid) return;

    // Wash trails on a heavier lerp than the grid so the light feels like
    // it has mass; the grid reveal stays close under the cursor.
    const pos = { x: -9999, y: -9999, wx: -9999, wy: -9999, o: 0, to: 0 };
    let raf = 0;

    const tick = () => {
      raf = 0;
      pos.wx += (pos.x - pos.wx) * 0.08;
      pos.wy += (pos.y - pos.wy) * 0.08;
      pos.o += (pos.to - pos.o) * 0.1;

      wash.style.transform = `translate3d(${pos.wx}px, ${pos.wy}px, 0) translate(-50%, -50%)`;
      wash.style.opacity = String(pos.o);
      grid.style.opacity = String(pos.o);
      grid.style.maskImage = `radial-gradient(340px at ${pos.x}px ${pos.y}px, black, transparent 72%)`;
      grid.style.webkitMaskImage = grid.style.maskImage;

      if (
        pos.to > 0 ||
        pos.o > 0.01 ||
        Math.abs(pos.x - pos.wx) > 0.5 ||
        Math.abs(pos.y - pos.wy) > 0.5
      ) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      pos.x = event.clientX;
      pos.y = event.clientY;
      if (pos.wx === -9999) {
        pos.wx = pos.x;
        pos.wy = pos.y;
      }
      pos.to = 1;
      if (raf === 0) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      pos.to = 0;
      if (raf === 0) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={gridRef}
        aria-hidden
        className="substrate-grid pointer-events-none fixed inset-0 -z-[1] opacity-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(140, 160, 210, 0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(140, 160, 210, 0.12) 1px, transparent 1px)",
        }}
      />
      <div
        ref={washRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[65] size-[640px] opacity-0"
        style={{
          background:
            "radial-gradient(closest-side, rgba(45, 140, 255, 0.055), transparent 70%)",
        }}
      />
    </>
  );
}
