"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EASE, ROTATE_DURATION, ROTATE_HOLD } from "@/lib/motion";

/**
 * The rotating slot in the hero headline. Words roll vertically (exit up,
 * enter from below) on a fixed cadence, in Signal Blue: the one sanctioned
 * inline emphasis. The slot reserves the widest word's width so the headline
 * never reflows; because the slot ends its line, the spare width is invisible.
 *
 * Rotation pauses while the tab is hidden. Reduced motion renders the static
 * closing word and never cycles.
 */

type RotatingWordProps = {
  /** Words to cycle, each rendered with the trailing punctuation attached. */
  words: readonly string[];
  /** Static replacement when the user prefers reduced motion. */
  staticWord: string;
};

export function RotatingWord({ words, staticWord }: RotatingWordProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setIndex((value) => (value + 1) % words.length);
    }, ROTATE_HOLD);
    return () => clearInterval(id);
  }, [reduceMotion, words.length]);

  if (reduceMotion) {
    return <span className="text-signal">{staticWord}</span>;
  }

  const longest = words.reduce(
    (widest, word) => (word.length > widest.length ? word : widest),
    "",
  );

  return (
    <span className="relative inline-grid overflow-hidden py-[0.12em] align-baseline [margin-block:-0.12em]">
      {/* Invisible sizer: reserves the widest word so the line never shifts. */}
      <span aria-hidden className="invisible [grid-area:1/1]">
        {longest}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={words[index]}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-110%", opacity: 0 }}
          transition={{ duration: ROTATE_DURATION, ease: EASE }}
          className="text-signal [grid-area:1/1]"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
