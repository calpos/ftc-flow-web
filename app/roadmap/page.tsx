import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { buttonPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Where FTC Flow is now and where it's heading: TestFlight beta summer 2026, App Store launch fall 2026, then a full web portal.",
  alternates: { canonical: "/roadmap" },
};

type Phase = {
  label: string;
  title: string;
  body: string;
  current?: boolean;
};

const phases: readonly Phase[] = [
  {
    label: "Now",
    title: "Core app complete, production polish",
    body: "The full feature set is built and running: tasks, projects, calendar, polls, and team management. Current work is the unglamorous part that makes it shippable: refactoring, strict types, tests, and CI.",
    current: true,
  },
  {
    label: "Summer 2026",
    title: "TestFlight beta with real FTC teams",
    body: "FTC Flow goes to TestFlight with my own team and a couple of others. Real seasons, real coordination, real feedback. What breaks gets fixed; what confuses gets redesigned.",
  },
  {
    label: "Fall 2026",
    title: "App Store launch",
    body: "Public release at the start of the 2026-27 season, rolled out through the early-access mailing list first. If you signed up, you hear about it before anyone else.",
  },
  {
    label: "Next",
    title: "The full web portal",
    body: "beta.ftcflow.app brings every app feature to the browser with account sync, because half of team coordination happens on a laptop sitting next to the robot.",
  },
  {
    label: "Beyond",
    title: "Deeper integrations",
    body: "GitHub and Onshape integrations to tie code and CAD into the same picture, plus team notes and documentation so knowledge stops evaporating between seasons.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
      <Reveal>
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
          Shipping in public.
        </h1>
        <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-fg-mid">
          {
            "FTC Flow is one student's build, and this is the honest state of it. No vaporware, no padded timelines: what's done, what's next, and where it's heading."
          }
        </p>
      </Reveal>

      <ol className="relative ml-2 mt-16 border-l border-edge">
        {phases.map((phase, index) => (
          <li key={phase.label} className="relative pb-14 pl-8 last:pb-0">
            <span
              aria-hidden
              className={`absolute -left-[7px] top-1.5 size-3.5 rounded-full border-2 ${
                phase.current
                  ? "border-signal-dim bg-signal"
                  : "border-edge bg-ink"
              }`}
            />
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

      <Reveal className="mt-20">
        <div className="rounded-2xl border border-edge bg-surface p-7 sm:p-9">
          <h2 className="text-xl font-medium">Want in early?</h2>
          <p className="mt-2 max-w-[32rem] leading-relaxed text-fg-mid">
            The mailing list is how the rollout happens. Beta invites and the
            launch announcement go there first.
          </p>
          <Link href="/early-access" className={`${buttonPrimary} mt-6`}>
            Get Early Access
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
