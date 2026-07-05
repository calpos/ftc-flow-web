import type { Metadata } from "next";
import Link from "next/link";
import { BrowserFrame } from "@/components/browser-frame";
import { Phone } from "@/components/phone";
import { Reveal } from "@/components/reveal";
import { RevealPhone } from "@/components/reveal-phone";
import { Spotlight } from "@/components/spotlight";
import { GridLayer } from "@/components/substrate";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { buttonPrimary, monoLabel } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Home dashboard, projects and tasks, season calendar, polls, and team roles — on your phone and in the browser. A tour of how FTC Flow runs an FTC season.",
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

function Index({ value }: { value: number }) {
  return (
    <p className={`${monoLabel} text-signal`}>
      {String(value).padStart(2, "0")}
    </p>
  );
}

function Chip({ children }: { children: string }) {
  return (
    <span className="rounded-md border border-edge bg-raised px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-fg-mid">
      {children}
    </span>
  );
}

/* 01 + 04 — the classic module: text and points beside a device. */
function SideBySide({
  index,
  title,
  body,
  points,
  pair,
  flip = false,
  eager = false,
}: {
  index: number;
  title: string;
  body: string;
  points?: readonly string[];
  pair: ShotPair;
  flip?: boolean;
  eager?: boolean;
}) {
  return (
    <section>
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16 lg:py-24">
        <Reveal className={flip ? "md:order-2" : undefined}>
          <Index value={index} />
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
      <header className="relative overflow-hidden border-b border-edge bg-surface">
        <div
          aria-hidden
          className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        />
        <GridLayer variant="top" />
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 lg:pb-20 lg:pt-24">
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

      {/* 01 — the anchor module. */}
      <SideBySide
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

      {/* 02 — points become spotlight cells. */}
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16 lg:py-24">
          <Reveal className="md:order-2">
            <Index value={2} />
            <h2 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              Structure that matches how teams work
            </h2>
            <p className="mt-5 max-w-[32rem] text-[1.0625rem] leading-relaxed text-fg-mid">
              Projects hold the big goals: the drivetrain rebuild, the
              engineering portfolio. Tasks carry the work, each with an owner,
              target date, and live progress.
            </p>
            <div className="mt-7 grid max-w-[32rem] gap-3 sm:grid-cols-2">
              {[
                "Tasks roll up into project progress automatically",
                "Search plus filters by status, owner, and due date",
                "Statuses that mean something: Started, Finalizing, Complete",
                "Creating a project or task takes seconds",
              ].map((point) => (
                <Spotlight
                  key={point}
                  className="rounded-[10px] border border-edge bg-surface px-4 py-3.5"
                >
                  <p className="text-sm leading-relaxed text-fg-mid">{point}</p>
                </Spotlight>
              ))}
            </div>
          </Reveal>
          <PhoneCluster pair={[shots.teamProjects, shots.teamTasks]} flip />
        </div>
      </section>

      {/* 03 — full-width band, centered, chips. */}
      <section className="relative overflow-hidden border-y border-edge bg-surface">
        <div
          aria-hidden
          className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 lg:py-24">
          <Reveal className="mx-auto max-w-2xl">
            <Index value={3} />
            <h2 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              The season at a glance
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-fg-mid">
              Six event types cover the real shape of an FTC season. The month
              view layers projects, tasks, and polls onto the same grid; the
              upcoming view turns it into an agenda you can act on.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2">
              <Chip>Month view</Chip>
              <Chip>Upcoming view</Chip>
              <Chip>6 event types</Chip>
              <Chip>Task + poll overlays</Chip>
              <Chip>Filters</Chip>
            </div>
          </Reveal>
          <PhoneCluster pair={[shots.calendarMonth, shots.calendarUpcoming]} />
        </div>
      </section>

      {/* 04 — the classic module, flipped, single device. */}
      <SideBySide
        index={4}
        title="Team decisions without the group-chat referee"
        body="Open a poll, set the options and a close date, and let the votes land. Results update live, voters can change their pick while it's open, and the decision stays recorded where the whole team can find it later."
        pair={[shots.teamPolls]}
        flip
      />

      {/* 05 — roles, with the perspective feature retired. */}
      <section>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:gap-16 lg:py-24">
          <Reveal>
            <Index value={5} />
            <h2 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              Everyone knows their role
            </h2>
            <p className="mt-5 max-w-[32rem] text-[1.0625rem] leading-relaxed text-fg-mid">
              The roster shows who does what, with coach and captain called out
              and work roles on every member. When something needs an owner,
              nobody has to ask who does CAD.
            </p>
            <div className="mt-7 flex max-w-[32rem] flex-wrap gap-2">
              <Chip>Coach</Chip>
              <Chip>Captain</Chip>
              <Chip>Programmer</Chip>
              <Chip>CAD designer</Chip>
              <Chip>Driver</Chip>
              <Chip>Outreach</Chip>
            </div>
          </Reveal>
          <PhoneCluster pair={[shots.teamMembers]} />
        </div>
      </section>

      {/* 06 — the web moment. */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        />
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Index value={6} />
            <h2 className="mt-4 text-balance text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              Also in your browser.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-fg-mid">
              The web beta puts the same console on the big screen: tasks,
              calendar, and polls at desktop width, synced with your phone.
              Half of team coordination happens on a laptop next to the robot.
            </p>
          </Reveal>
          <RevealPhone
            className="mx-auto mt-12 max-w-4xl"
            glowClassName="-inset-[10%]"
          >
            <BrowserFrame
              shot={shots.webHome}
              sizes="(min-width: 1024px) 896px, 92vw"
            />
          </RevealPhone>
        </div>
      </section>

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
              Screenshots only say so much. The beta opens August 2026.
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
