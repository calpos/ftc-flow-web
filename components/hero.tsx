"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { LightField } from "@/components/light-field";
import { Phone } from "@/components/phone";
import { RotatingWord } from "@/components/rotating-word";
import { GridLayer } from "@/components/substrate";
import { Tilt } from "@/components/tilt";
import { EASE, SETTLE_SPRING, STAGGER } from "@/lib/motion";
import { shots } from "@/lib/screenshots";
import { buttonPrimary, buttonSecondary, monoLabel } from "@/lib/ui";

const LINE_ONE = ["Your", "team's", "home"];

const ROTATING = ["tasks.", "projects.", "polls.", "progress."] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  // Depth: the device leans toward the cursor (the grid stays put so the
  // world grid keeps its viewport alignment). Fine pointers at desktop only.
  const [depthOn, setDepthOn] = useState(false);
  useEffect(() => {
    if (reduceMotion) return;
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setDepthOn(mq.matches && window.innerWidth >= 1024);
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
  const phoneX = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), SETTLE_SPRING);
  const phoneY = useSpring(useTransform(py, [-0.5, 0.5], [-5, 5]), SETTLE_SPRING);

  const handleDepthMove = (event: PointerEvent<HTMLElement>) => {
    if (!depthOn) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };
  const resetDepth = () => {
    px.set(0);
    py.set(0);
  };

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: EASE, delay },
        };

  return (
    <section
      className="relative overflow-hidden"
      onPointerMove={handleDepthMove}
      onPointerLeave={resetDepth}
    >
      <LightField className="pointer-events-none absolute inset-0 -z-10" />
      <GridLayer variant="top" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:pb-28 lg:pt-24">
        <div>
          <motion.p
            {...enter(0)}
            className={`${monoLabel} text-signal`}
          >
            For FIRST Tech Challenge teams
          </motion.p>
          <h1 className="mt-6 text-[clamp(2.75rem,6.5vw,5rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
            {LINE_ONE.map((word, index) => (
              <motion.span
                key={word}
                {...enter(0.08 + index * STAGGER)}
                className="mr-[0.25em] inline-block"
              >
                {word}
              </motion.span>
            ))}
            <br />
            <motion.span
              {...enter(0.08 + LINE_ONE.length * STAGGER)}
              className="mr-[0.25em] inline-block"
            >
              for
            </motion.span>
            <motion.span
              {...enter(0.08 + (LINE_ONE.length + 1) * STAGGER)}
              className="inline-block"
            >
              <RotatingWord words={ROTATING} staticWord="the season." />
            </motion.span>
          </h1>
          <motion.p
            {...enter(0.24 + LINE_ONE.length * STAGGER)}
            className="mt-7 max-w-[34rem] text-lg leading-relaxed text-fg-mid"
          >
            {
              "FTC Flow puts tasks, projects, schedule, and decisions in one calm place, on your phone and in the browser. Who's doing what, by when: answered in fifteen seconds, not fifteen messages."
            }
          </motion.p>
          <motion.div
            {...enter(0.32 + LINE_ONE.length * STAGGER)}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link href="/early-access" className={buttonPrimary}>
              Get Early Access
            </Link>
            <Link href="/features" className={buttonSecondary}>
              Explore Features
            </Link>
          </motion.div>
          <motion.p
            {...enter(0.4 + LINE_ONE.length * STAGGER)}
            className={`${monoLabel} mt-8 text-fg-dim`}
          >
            Beta release August 2026 · Full release September 2026
          </motion.p>
        </div>
        <motion.div
          {...enter(0.2)}
          className="relative mx-auto w-[min(80vw,380px)] lg:w-[380px]"
        >
          <motion.div style={depthOn ? { x: phoneX, y: phoneY } : undefined}>
            <Tilt className="lg:rotate-[1.5deg]">
              <Phone
                shot={shots.home1}
                priority
                sizes="(min-width: 640px) 380px, 80vw"
              />
            </Tilt>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
