"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Phone } from "@/components/phone";
import { Reveal } from "@/components/reveal";
import { RevealPhone } from "@/components/reveal-phone";
import { EASE } from "@/lib/motion";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { monoLabel } from "@/lib/ui";

/**
 * The walkthrough: the home page's spine. On desktop the device frame pins
 * to the viewport while four steps scroll past; the screen swaps to match
 * the active step, so one console visibly changes jobs instead of four
 * identical sections repeating. Small viewports and reduced motion get the
 * honest stacked version.
 */

type Step = {
  id: string;
  title: string;
  body: string;
  shot: Screenshot;
};

const STEPS: readonly Step[] = [
  {
    id: "check-in",
    title: "The fifteen-second check‑in",
    body: "Open the app and the answer is already on screen: your next event, the next competition, and what's waiting on you. No digging, no scrolling through chat history. Check it between matches and get back to the robot.",
    shot: shots.home2,
  },
  {
    id: "tasks",
    title: "Who's doing what, by when",
    body: "Projects break into tasks, tasks have owners, owners have deadlines. Progress is visible to the whole team, so nothing quietly stalls in someone's mental to-do list.",
    shot: shots.teamTasks,
  },
  {
    id: "calendar",
    title: "The whole season on one screen",
    body: "Month and upcoming views hold meetings, build sessions, scrimmages, and competitions, layered with the projects, tasks, and polls attached to them. Filter down to one kind of chaos at a time.",
    shot: shots.calendarMonth,
  },
  {
    id: "polls",
    title: "Decide fast. Move on.",
    body: "Drivetrain A or B? Saturday or Sunday practice? Put it to a vote, watch results land live, and get back to building instead of refereeing a group chat.",
    shot: shots.teamPolls,
  },
];

/** Index of the step whose block currently crosses the viewport's center band. */
function useActiveStep(count: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = refs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const node of refs.current.slice(0, count)) {
      if (node) io.observe(node);
    }
    return () => io.disconnect();
  }, [count]);

  return { active, refs };
}

function SectionHeader() {
  return (
    <Reveal className="mx-auto max-w-6xl px-5 sm:px-8">
      <p className={`${monoLabel} text-fg-dim`}>The tour</p>
      <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.02em]">
        Four screens run the season.
      </h2>
    </Reveal>
  );
}

function StackedWalkthrough() {
  return (
    <section className="pt-16 lg:pt-24">
      <SectionHeader />
      {STEPS.map((step, index) => (
        <div
          key={step.id}
          className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 md:grid-cols-2 md:gap-16"
        >
          <Reveal className={index % 2 === 1 ? "md:order-2" : undefined}>
            <p className={`${monoLabel} text-signal`}>
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              {step.title}
            </h3>
            <p className="mt-5 max-w-[32rem] text-[1.0625rem] leading-relaxed text-fg-mid">
              {step.body}
            </p>
          </Reveal>
          <RevealPhone
            className={`mx-auto w-[min(72vw,300px)] ${index % 2 === 1 ? "md:order-1" : ""}`}
          >
            <Phone shot={step.shot} />
          </RevealPhone>
        </div>
      ))}
    </section>
  );
}

export function Walkthrough() {
  const reduceMotion = useReducedMotion();
  const { active, refs } = useActiveStep(STEPS.length);

  if (reduceMotion) {
    return <StackedWalkthrough />;
  }

  return (
    <>
      {/* Small viewports: the stacked version, no pinning. */}
      <div className="md:hidden">
        <StackedWalkthrough />
      </div>

      <section className="relative hidden md:block md:pt-24">
        <SectionHeader />
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_minmax(300px,360px)] gap-16 px-5 sm:px-8 lg:gap-24">
          {/* Steps rail: spine + four viewport-height beats. */}
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-y-[10vh] left-0 w-px bg-edge"
            />
            <motion.div
              aria-hidden
              initial={false}
              animate={{ scaleY: (active + 1) / STEPS.length }}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute inset-y-[10vh] left-0 w-px origin-top bg-signal"
            />
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                ref={(node) => {
                  refs.current[index] = node;
                }}
                className="flex min-h-[72vh] flex-col justify-center py-12 pl-10"
              >
                <motion.div
                  initial={false}
                  animate={{ opacity: active === index ? 1 : 0.3 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <p
                    className={`${monoLabel} ${
                      active === index ? "text-signal" : "text-fg-dim"
                    } transition-colors duration-300`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 text-balance text-[clamp(1.75rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="mt-5 max-w-[28rem] text-[1.0625rem] leading-relaxed text-fg-mid">
                    {step.body}
                  </p>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Pinned console: one device, four jobs. */}
          <div className="relative">
            <div className="sticky top-[max(6rem,calc(50vh-24rem))]">
              <div className="relative isolate mx-auto w-[min(100%,340px)]">
                <div
                  aria-hidden
                  className="backlight absolute -inset-[24%] -z-10"
                />
                {STEPS.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={false}
                    animate={{
                      opacity: active === index ? 1 : 0,
                      y: active === index ? 0 : 10,
                    }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className={index === 0 ? "relative" : "absolute inset-0"}
                  >
                    <Phone
                      shot={step.shot}
                      sizes="(min-width: 768px) 340px, 72vw"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
