import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "@/components/phone";
import { Reveal } from "@/components/reveal";
import { RevealPhone } from "@/components/reveal-phone";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { buttonPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Home dashboard, projects and tasks, season calendar, polls, and team roles. A tour of how FTC Flow runs an FTC season.",
  alternates: { canonical: "/features" },
};

type ShotPair = readonly [Screenshot] | readonly [Screenshot, Screenshot];

function PhoneCluster({ pair, flip }: { pair: ShotPair; flip?: boolean }) {
  const orderClass = flip ? "md:order-1" : "";
  if (pair.length === 1) {
    return (
      <RevealPhone
        className={`mx-auto w-[min(72vw,300px)] ${orderClass}`}
        glowClassName="-inset-[20%]"
      >
        <Phone shot={pair[0]} sizes="(min-width: 768px) 300px, 72vw" />
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
        className="w-[46%]"
        sizes="(min-width: 768px) 240px, 42vw"
      />
      <Phone
        shot={pair[1]}
        className="mt-12 w-[46%]"
        sizes="(min-width: 768px) 240px, 42vw"
      />
    </RevealPhone>
  );
}

type FeatureSectionProps = {
  title: string;
  body: string;
  points?: readonly string[];
  pair: ShotPair;
  flip?: boolean;
};

function FeatureSection({
  title,
  body,
  points,
  pair,
  flip = false,
}: FeatureSectionProps) {
  return (
    <section>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16 lg:py-24">
        <Reveal className={flip ? "md:order-2" : undefined}>
          <h2 className="flex items-start gap-3 text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
            <span
              aria-hidden
              className="mt-[0.5em] size-2.5 shrink-0 rounded-full bg-signal"
            />
            <span>{title}</span>
          </h2>
          <div className="pl-[1.375rem]">
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
          </div>
        </Reveal>
        <PhoneCluster pair={pair} flip={flip} />
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <>
      <header className="mx-auto max-w-6xl px-5 pt-16 sm:px-8 lg:pt-24">
        <Reveal className="max-w-3xl">
          <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            {"Everything a team needs. Nothing it doesn't."}
          </h1>
          <p className="mt-6 max-w-[36rem] text-lg leading-relaxed text-fg-mid">
            {
              "FTC Flow covers the coordination layer of an FTC season: what's happening, who owns what, and what the team decided. Here's what that looks like."
            }
          </p>
        </Reveal>
      </header>

      <FeatureSection
        title="The fifteen-second check-in"
        body="The dashboard answers the only question that matters mid-season: what do I do next? Your next event and next key event sit on top, with pending actions scoped to you, not the whole roster. Tap one and you land on a list already filtered to your name."
        points={[
          "Next Event and Next Key Event, always on top",
          "Pending actions scoped to you, pre-filtered on tap",
          "Your tasks and projects with live progress",
        ]}
        pair={[shots.home1, shots.home2]}
      />

      <FeatureSection
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
        title="Team decisions without the group-chat referee"
        body="Open a poll, set the options and a close date, and let the votes land. Results update live, voters can change their pick while it's open, and the decision stays recorded where the whole team can find it later."
        pair={[shots.teamPolls]}
        flip
      />

      <FeatureSection
        title="Everyone knows their role"
        body="The roster shows who does what: coach, captain, programmer, CAD designer, driver, outreach. Switch the active perspective to see the app exactly as a teammate does, which is how scoped views stay honest."
        points={[
          "Work roles on every member, visible to everyone",
          "Coach and captain roles called out on the roster",
          "Perspective switching to test any member's view",
        ]}
        pair={[shots.teamMembers, shots.accounts]}
      />

      <section className="border-t border-edge">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:px-8 lg:py-24">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
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
