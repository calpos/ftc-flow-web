import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Spotlight } from "@/components/spotlight";
import { GridLayer } from "@/components/substrate";
import { Timeline } from "@/components/timeline";
import type { Phase } from "@/components/timeline";
import { buttonPrimary, monoLabel } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Where FTC Flow is now and where it's heading: beta on TestFlight and the web in August 2026, full release September 2026, then deeper integrations.",
  alternates: { canonical: "/roadmap" },
};

const phases: readonly Phase[] = [
  {
    label: "Now",
    title: "Core app complete, production polish",
    body: "The full feature set is built and running (tasks, projects, calendar, polls, and team management), with the web version taking shape alongside it. Current work is the unglamorous part that makes it shippable: refactoring, strict types, tests, and CI.",
    current: true,
  },
  {
    label: "August 2026",
    title: "Beta release, on your phone and in the browser",
    body: "The beta opens two doors at once: TestFlight on iOS and a web beta at beta.ftcflow.app, synced. Real seasons, real coordination, real feedback. What breaks gets fixed; what confuses gets redesigned.",
    chips: ["TestFlight", "beta.ftcflow.app", "Real FTC teams"],
  },
  {
    label: "September 2026",
    title: "Full release, everywhere",
    body: "Public launch at the start of the 2026-27 season: the App Store and the full web app with account sync, rolled out through the early-access mailing list first. If you signed up, you hear about it before anyone else.",
  },
  {
    label: "Beyond",
    title: "Deeper integrations",
    body: "GitHub and Onshape integrations to tie code and CAD into the same picture, plus team notes and documentation so knowledge stops evaporating between seasons.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />
      <GridLayer variant="top" />
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
      <Reveal>
        <p className={`${monoLabel} text-fg-dim`}>The roadmap</p>
        <h1 className="mt-5 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
          Shipping in public.
        </h1>
        <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-fg-mid">
          {
            "FTC Flow is one student's build, and this is the honest state of it. No vaporware, no padded timelines: what's done, what's next, and where it's heading."
          }
        </p>
      </Reveal>

      <Timeline phases={phases} />

      <Reveal className="mt-20">
        <Spotlight className="rounded-2xl border border-edge bg-surface transition-colors duration-200 hover:border-signal-dim">
          <div className="p-7 sm:p-9">
            <h2 className="text-xl font-medium">Want in early?</h2>
            <p className="mt-2 max-w-[32rem] leading-relaxed text-fg-mid">
              The mailing list is how the rollout happens. Beta invites and the
              launch announcement go there first.
            </p>
            <Link href="/early-access" className={`${buttonPrimary} mt-6`}>
              Get Early Access
            </Link>
          </div>
        </Spotlight>
      </Reveal>
      </div>
    </div>
  );
}
