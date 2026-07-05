"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import type { MotionValue } from "motion/react";
import { Phone } from "@/components/phone";
import { Reveal } from "@/components/reveal";
import { RevealPhone } from "@/components/reveal-phone";
import { EASE, SETTLE_SPRING } from "@/lib/motion";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { monoLabel } from "@/lib/ui";

/**
 * The walkthrough: the home page's spine. On desktop the whole stage pins
 * to the viewport: a vertical card carousel on the left scrubs with scroll
 * (spring-settled, active card centered and lit), while the device on the
 * right flips edge-on around its Y axis to swap screens at each step, so
 * one console visibly changes jobs. Small viewports and reduced motion get
 * the honest stacked version.
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
    body: "Open the app and the answer is already on screen: your next event, the next competition, and what's waiting on you. No digging, no scrolling through chat history.",
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
    body: "Month and upcoming views hold meetings, build sessions, scrimmages, and competitions, layered with the projects, tasks, and polls attached to them.",
    shot: shots.calendarMonth,
  },
  {
    id: "polls",
    title: "Decide fast. Move on.",
    body: "Drivetrain A or B? Saturday or Sunday practice? Put it to a vote, watch results land live, and get back to building instead of refereeing a group chat.",
    shot: shots.teamPolls,
  },
];

/** Card slot height in px: fixed card height plus the gap between cards. */
const CARD_H = 200;
const CARD_GAP = 20;
const CARD_STEP = CARD_H + CARD_GAP;

/** Height of the carousel window on the left of the pinned stage. */
const WINDOW_H = 480;

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

function TourCard({
  step,
  index,
  active,
  distance,
}: {
  step: Step;
  index: number;
  active: boolean;
  /** Continuous distance from the centered position, as a motion value. */
  distance: MotionValue<number>;
}) {
  const opacity = useTransform(distance, [0, 1, 2], [1, 0.35, 0.2]);
  const scale = useTransform(distance, [0, 1], [1, 0.97]);

  return (
    <motion.article
      style={{ opacity, scale, height: CARD_H }}
      className={`overflow-hidden rounded-[16px] border bg-surface p-6 transition-colors duration-300 ${
        active ? "border-signal-dim" : "border-edge"
      }`}
    >
      <p
        className={`${monoLabel} ${active ? "text-signal" : "text-fg-dim"} transition-colors duration-300`}
      >
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="mt-3 text-balance text-xl font-semibold leading-tight tracking-[-0.01em]">
        {step.title}
      </h3>
      <p className="mt-2.5 text-sm leading-relaxed text-fg-mid">{step.body}</p>
    </motion.article>
  );
}

function TourDesktop() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  const count = STEPS.length;

  // Continuous card index 0..n-1, scrubbed by scroll and spring-settled.
  const cont = useTransform(scrollYProgress, [0, 1], [0, count - 1]);
  const contSpring = useSpring(cont, SETTLE_SPRING);
  const trackY = useTransform(contSpring, (v) => -v * CARD_STEP);
  const spineScale = useSpring(scrollYProgress, SETTLE_SPRING);

  // Two-phase Y-flip: rotate edge-on, swap the screen, rotate back.
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

  useMotionValueEvent(cont, "change", (v) => {
    const idx = Math.min(count - 1, Math.max(0, Math.round(v)));
    if (idx !== active) {
      setActive(idx);
      // Kick off the flip; mid-flip changes are picked up on completion.
      if (phase === "idle") setPhase("out");
    }
  });

  // Per-card distance motion values (fixed count, stable hook order).
  const distances = STEPS.map((_, index) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks -- STEPS is a module constant; count never changes
    useTransform(contSpring, (v) => Math.abs(v - index)),
  );

  return (
    <section className="pt-16 lg:pt-24">
      <SectionHeader />
      <div ref={runwayRef} className="relative mt-4 h-[340vh]">
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_minmax(300px,360px)] items-center gap-16 px-5 sm:px-8 lg:gap-24">
            {/* Carousel: spine + windowed card track. */}
            <div className="flex items-center gap-8">
              <div
                aria-hidden
                className="relative w-px self-center bg-edge"
                style={{ height: WINDOW_H - 80 }}
              >
                <motion.div
                  style={{ scaleY: spineScale }}
                  className="absolute inset-0 origin-top bg-signal"
                />
              </div>
              <div
                className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_82%,transparent)]"
                style={{ height: WINDOW_H }}
              >
                <motion.div
                  style={{
                    y: trackY,
                    top: (WINDOW_H - CARD_H) / 2,
                    rowGap: CARD_GAP,
                  }}
                  className="absolute inset-x-0 grid"
                >
                  {STEPS.map((step, index) => (
                    <TourCard
                      key={step.id}
                      step={step}
                      index={index}
                      active={active === index}
                      distance={distances[index]}
                    />
                  ))}
                </motion.div>
              </div>
            </div>

            {/* The console: one device, four jobs, flipping between them. */}
            <div className="relative isolate mx-auto w-[min(100%,340px)]">
              <div aria-hidden className="backlight absolute -inset-[24%] -z-10" />
              <motion.div
                animate={
                  phase === "out"
                    ? { rotateY: 90, scale: 0.96 }
                    : { rotateY: 0, scale: 1 }
                }
                transition={
                  phase === "out"
                    ? { duration: 0.22, ease: [0.55, 0, 1, 0.45] }
                    : { duration: 0.34, ease: EASE }
                }
                onAnimationComplete={() => {
                  if (phase === "out") {
                    setShown(active);
                    setPhase("in");
                  } else if (phase === "in") {
                    setPhase(active === shown ? "idle" : "out");
                  }
                }}
                style={{ transformPerspective: 1200 }}
              >
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    aria-hidden={index !== shown}
                    className={`${index === 0 ? "relative" : "absolute inset-0"} ${
                      index === shown ? "" : "invisible"
                    }`}
                  >
                    <Phone
                      shot={step.shot}
                      sizes="(min-width: 768px) 340px, 72vw"
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Walkthrough() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <StackedWalkthrough />;
  }

  return (
    <>
      {/* Small viewports: the stacked version, no pinning. */}
      <div className="md:hidden">
        <StackedWalkthrough />
      </div>
      <div className="hidden md:block">
        <TourDesktop />
      </div>
    </>
  );
}
