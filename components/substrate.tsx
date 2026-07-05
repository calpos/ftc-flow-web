"use client";

import { useEffect, useRef } from "react";

/**
 * The Substrate: the console's chassis. Static, aria-hidden texture layers
 * that give the near-black canvas quiet structure.
 *
 * The grid is one world grid in DOCUMENT space: every GridLayer offsets its
 * pattern by its own document position (modulo the module size), so all
 * gridlines across the site are the same global lines, they scroll with the
 * page, and the cursor reveal (which applies the scroll offset itself) lands
 * exactly on them.
 */

/** Grid module size in px. Mirrors background-size in globals.css. */
export const GRID_MODULE = 56;

/** Film grain over the whole page. Mounted once per layout, above content. */
export function Grain() {
  return (
    <div
      aria-hidden
      className="grain pointer-events-none fixed inset-0 z-[70] opacity-[0.035]"
    />
  );
}

type GridLayerProps = {
  /** Mask variant: radial fade (default) or top-hung dissolve. */
  variant?: "fade" | "top";
  className?: string;
};

/** Faint engineering grid behind a section. Position the parent relative. */
export function GridLayer({ variant = "fade", className }: GridLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const align = () => {
      const rect = node.getBoundingClientRect();
      const docX = rect.left + window.scrollX;
      const docY = rect.top + window.scrollY;
      node.style.backgroundPosition = `${-(((docX % GRID_MODULE) + GRID_MODULE) % GRID_MODULE)}px ${-(((docY % GRID_MODULE) + GRID_MODULE) % GRID_MODULE)}px`;
    };

    align();
    // Entrance reveals translate ancestors for ~0.6s; re-measure after they
    // settle so the offset reflects the layer's resting document position.
    const settle = setTimeout(align, 800);

    window.addEventListener("resize", align);
    const ro = new ResizeObserver(align);
    ro.observe(document.body);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("resize", align);
      ro.disconnect();
    };
  }, []);

  const mask =
    variant === "top" ? "substrate-grid-top" : "substrate-grid-fade";
  return (
    <div
      ref={ref}
      aria-hidden
      className={`substrate-grid ${mask} pointer-events-none absolute inset-0 -z-10 ${className ?? ""}`}
    />
  );
}

/**
 * A full-width hairline with small `+` ticks where it crosses the content
 * container: the section marker of an engineering drawing.
 */
export function SectionRule() {
  return (
    <div aria-hidden className="relative h-px">
      <div className="absolute inset-x-0 top-0 h-px bg-edge" />
      <div className="mx-auto flex h-px max-w-6xl items-center justify-between px-5 sm:px-8">
        <span className="relative -top-px select-none font-mono text-[10px] leading-none text-fg-dim/60">
          +
        </span>
        <span className="relative -top-px select-none font-mono text-[10px] leading-none text-fg-dim/60">
          +
        </span>
      </div>
    </div>
  );
}
