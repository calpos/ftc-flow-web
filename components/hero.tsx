"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Phone } from "@/components/phone";
import { shots } from "@/lib/screenshots";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

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
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-28 lg:pt-24">
        <div>
          <motion.p
            {...enter(0)}
            className="text-xs font-medium uppercase tracking-[0.08em] text-signal"
          >
            For FIRST Tech Challenge teams
          </motion.p>
          <motion.h1
            {...enter(0.08)}
            className="mt-5 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
          >
            Your team, in flow.
          </motion.h1>
          <motion.p
            {...enter(0.16)}
            className="mt-6 max-w-[34rem] text-lg leading-relaxed text-fg-mid"
          >
            {
              "FTC Flow puts tasks, projects, schedule, and decisions in one calm place. Who's doing what, by when: answered in fifteen seconds, not fifteen messages."
            }
          </motion.p>
          <motion.div {...enter(0.24)} className="mt-9 flex flex-wrap gap-3">
            <Link href="/early-access" className={buttonPrimary}>
              Get Early Access
            </Link>
            <Link href="/features" className={buttonSecondary}>
              Explore Features
            </Link>
          </motion.div>
          <motion.p {...enter(0.32)} className="mt-6 text-sm text-fg-dim">
            TestFlight beta summer 2026 · App Store fall 2026
          </motion.p>
        </div>
        <motion.div
          {...enter(0.2)}
          className="mx-auto w-[min(78vw,340px)] lg:w-[340px]"
        >
          <Phone
            shot={shots.home1}
            priority
            glow
            sizes="(min-width: 640px) 340px, 78vw"
          />
        </motion.div>
      </div>
    </section>
  );
}
