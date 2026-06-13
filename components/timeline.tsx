"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";
import { Reveal } from "@/components/reveal";
import { EASE } from "@/lib/motion";

export type Phase = {
  label: string;
  title: string;
  body: string;
  current?: boolean;
};

/**
 * The roadmap spine draws itself: a Signal-Blue line fills downward over the
 * gray hairline as you scroll the list, and each phase node pops into view on
 * entry. Reduced motion: the calm gray hairline, nodes static.
 */
export function Timeline({ phases }: { phases: readonly Phase[] }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLOListElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.8", "end 0.65"],
  });
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.5,
  });

  return (
    <ol ref={ref} className="relative ml-2 mt-16 border-l border-edge">
      {!reduceMotion ? (
        <motion.span
          aria-hidden
          style={{ scaleY }}
          className="absolute -left-px top-0 h-full w-px origin-top bg-signal"
        />
      ) : null}

      {phases.map((phase, index) => (
        <li key={phase.label} className="relative pb-14 pl-8 last:pb-0">
          {reduceMotion ? (
            <span
              aria-hidden
              className={`absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 ${
                phase.current
                  ? "border-signal-dim bg-signal"
                  : "border-edge bg-ink"
              }`}
            />
          ) : (
            <motion.span
              aria-hidden
              initial={{ scale: 0.4, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -20% 0px" }}
              transition={{ duration: 0.4, ease: EASE }}
              className={`absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 ${
                phase.current
                  ? "border-signal-dim bg-signal"
                  : "border-edge bg-ink"
              }`}
            />
          )}
          <Reveal delay={index * 0.05}>
            <p
              className={`text-xs font-medium uppercase tracking-[0.08em] ${
                phase.current ? "text-signal" : "text-fg-dim"
              }`}
            >
              {phase.label}
              {phase.current ? " · In progress" : null}
            </p>
            <h2 className="mt-2.5 text-2xl font-medium tracking-[-0.01em]">
              {phase.title}
            </h2>
            <p className="mt-3 max-w-[36rem] leading-relaxed text-fg-mid">
              {phase.body}
            </p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
