import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "@/components/phone";
import { Reveal } from "@/components/reveal";
import { RevealPhone } from "@/components/reveal-phone";
import { GridLayer } from "@/components/substrate";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { buttonPrimary, monoLabel } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Home dashboard, projects and tasks, season calendar, polls, and team roles. A tour of how FTC Flow runs an FTC season.",
  alternates: { canonical: "/features" },
};

type ShotPair = readonly [Screenshot] | readonly [Screenshot, Screenshot];

function PhoneCluster({
  pair,
  flip,
  eager = false,
}: {
  pair: ShotPair;
  flip?: boolean;
  eager?: boolean;
}) {
  const orderClass = flip ? "md:order-1" : "";
  if (pair.length === 1) {
    return (
      <RevealPhone
        className={`mx-auto w-[min(72vw,300px)] ${orderClass}`}
        glowClassName="-inset-[20%]"
      >
        <Phone
          shot={pair[0]}
          priority={eager}
          sizes="(min-width: 768px) 300px, 72vw"
        />
      </RevealPhone>
    );
  }
  return (
    <RevealPhone
      className={`mx-auto w-full max-w-[520px] ${orderClass}`}
      contentClassName="flex justify-center gap-5"
      glowClassName="-inset-[12%]"
    >
      <Phone
        shot={pair[0]}
        priority={eager}
        className="w-[46%]"
        sizes="(min-width: 768px) 240px, 42vw"
      />
      <Phone
        shot={pair[1]}
        priority={eager}
        className="mt-12 w-[46%]"
        sizes="(min-width: 768px) 240px, 42vw"
      />
    </RevealPhone>
  );
}

type FeatureSectionProps = {
  index: number;
  title: string;
  body: string;
  points?: readonly string[];
  pair: ShotPair;
  flip?: boolean;
  eager?: boolean;
};

function FeatureSection({
  index,
  title,
  body,
  points,
  pair,
  flip = false,
  eager = false,
}: FeatureSectionProps) {
  return (
    <section>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16 lg:py-24">
        <Reveal className={flip ? "md:order-2" : undefined}>
          <p className={`${monoLabel} text-signal`}>
            {String(index).padStart(2, "0")}
          </p>
          <h2 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </h2>
          <p className="mt-5 max-w-[32rem] text-[1.0625rem] leading-relaxed text-fg-mid">
            {body}
          </p>
          {points ? (
            <ul className="mt-7 max-w-[32rem] border-t border-edge">
              {points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 border-b border-edge py-3.5 text-[0.9375rem] leading-relaxed text-fg-mid"
                >
                  <span
                    aria-hidden
                    className="mt-[0.5em] size-1.5 shrink-0 rounded-full bg-signal-dim"
                  />
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
        </Reveal>
        <PhoneCluster pair={pair} flip={flip} eager={eager} />
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <header className="relative overflow-hidden">
        <div
          aria-hidden
          className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        />
        <GridLayer variant="top" />
        <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 lg:pt-24">
          <Reveal className="max-w-3xl">
            <p className={`${monoLabel} text-fg-dim`}>The features</p>
            <h1 className="mt-5 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
              {"Everything a team needs. Nothing it doesn't."}
            </h1>
            <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-fg-mid">
              {
                "FTC Flow covers the coordination layer of an FTC season: what's happening, who owns what, and what the team decided. Here's what that looks like."
              }
            </p>
          </Reveal>
        </div>
      </header>

      <FeatureSection
        index={1}
        title={"The fifteen-second check‑in"}
        body="The dashboard answers the only question that matters mid-season: what do I do next? Your next event and next key event sit on top, with pending actions scoped to you, not the whole roster. Tap one and you land on a list already filtered to your name."
        points={[
          "Next Event and Next Key Event, always on top",
          "Pending actions scoped to you, pre-filtered on tap",
          "Your tasks and projects with live progress",
        ]}
        pair={[shots.home1, shots.home2]}
        eager
      />

      <FeatureSection
        index={2}
        title="Structure that matches how teams work"
        body="Projects hold the big goals: the drivetrain rebuild, the engineering portfolio. Tasks carry the work, each with an owner, target date, and live progress. Search and filters keep a long season's backlog navigable, and creating either takes seconds."
        points={[
          "Tasks roll up into project progress automatically",
          "Search plus filters by status, owner, and due date",
          "Statuses that mean something: Started, Finalizing, Complete",
        ]}
        pair={[shots.teamProjects, shots.teamTasks]}
        flip
      />

      <FeatureSection
        index={3}
        title="The season at a glance"
        body="Six event types cover the real shape of an FTC season: meetings, build sessions, scrimmages, competitions, outreach, and everything else. The month view layers projects, tasks, and polls onto the same grid; the upcoming view turns it into an agenda you can act on."
        points={[
          "Month and Upcoming views",
          "Six event types, plus project, task, and poll overlays",
          "Filters for exactly one kind of chaos at a time",
        ]}
        pair={[shots.calendarMonth, shots.calendarUpcoming]}
      />

      <FeatureSection
        index={4}
        title="Team decisions without the group-chat referee"
        body="Open a poll, set the options and a close date, and let the votes land. Results update live, voters can change their pick while it's open, and the decision stays recorded where the whole team can find it later."
        pair={[shots.teamPolls]}
        flip
      />

      <FeatureSection
        index={5}
        title="Everyone knows their role"
        body="The roster shows who does what: coach, captain, programmer, CAD designer, driver, outreach. Switch the active perspective to see the app exactly as a teammate does, which is how scoped views stay honest."
        points={[
          "Work roles on every member, visible to everyone",
          "Coach and captain roles called out on the roster",
          "Perspective switching to test any member's view",
        ]}
        pair={[shots.teamMembers, shots.accounts]}
      />

      <section className="relative overflow-hidden border-t border-edge">
        <div
          aria-hidden
          className="backlight absolute left-1/2 top-1/2 h-[420px] w-[680px] -translate-x-1/2 -translate-y-1/2"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 lg:py-24">
          <Reveal>
            <h2 className="text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              See it in your hands instead.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-fg-mid">
              Screenshots only say so much. The TestFlight beta opens summer
              2026.
            </p>
            <div className="mt-9">
              <Link href="/early-access" className={buttonPrimary}>
                Get Early Access
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
