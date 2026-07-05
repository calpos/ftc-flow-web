/**
 * The Substrate: the console's chassis. Static, aria-hidden texture layers
 * that give the near-black canvas quiet structure. Pure CSS, zero JS cost.
 */

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
  const mask =
    variant === "top" ? "substrate-grid-top" : "substrate-grid-fade";
  return (
    <div
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
