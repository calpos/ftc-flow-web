"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { LightField } from "@/components/light-field";
import { Phone } from "@/components/phone";
import { RotatingWord } from "@/components/rotating-word";
import { GridLayer } from "@/components/substrate";
import { Tilt } from "@/components/tilt";
import { EASE, STAGGER } from "@/lib/motion";
import { shots } from "@/lib/screenshots";
import { buttonPrimary, buttonSecondary, monoLabel } from "@/lib/ui";

const LINE_ONE = ["Your", "team's", "home"];

const ROTATING = ["tasks.", "projects.", "polls.", "progress."] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, ease: EASE, delay },
        };

  return (
    <section className="relative overflow-hidden">
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
              "FTC Flow puts tasks, projects, schedule, and decisions in one calm place. Who's doing what, by when: answered in fifteen seconds, not fifteen messages."
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
            TestFlight summer 2026 · App Store fall 2026
          </motion.p>
        </div>
        <motion.div
          {...enter(0.2)}
          className="relative mx-auto w-[min(80vw,380px)] lg:w-[380px]"
        >
          <Tilt className="lg:rotate-[1.5deg]">
            <Phone
              shot={shots.home1}
              priority
              sizes="(min-width: 640px) 380px, 80vw"
            />
          </Tilt>
        </motion.div>
      </div>
    </section>
  );
}
