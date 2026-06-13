import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/hero";
import { Phone } from "@/components/phone";
import { Reveal } from "@/components/reveal";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { buttonPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

type TeaserProps = {
  title: string;
  body: string;
  shot: Screenshot;
  flip?: boolean;
};

function Teaser({ title, body, shot, flip = false }: TeaserProps) {
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
          <p className="mt-5 max-w-[32rem] pl-[1.375rem] text-[1.0625rem] leading-relaxed text-fg-mid">
            {body}
          </p>
        </Reveal>
        <Reveal
          delay={0.12}
          className={`mx-auto w-[min(72vw,300px)] ${flip ? "md:order-1" : ""}`}
        >
          <Phone shot={shot} />
        </Reveal>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />

      <Teaser
        title="The fifteen-second check-in"
        body="Open the app and the answer is already on screen: your next event, the next competition, and what's waiting on you. No digging, no scrolling through chat history. Check it between matches and get back to the robot."
        shot={shots.home2}
      />
      <Teaser
        title="Who's doing what, by when"
        body="Projects break into tasks, tasks have owners, owners have deadlines. Progress is visible to the whole team, so nothing quietly stalls in someone's mental to-do list."
        shot={shots.teamTasks}
        flip
      />
      <Teaser
        title="The whole season on one screen"
        body="Month and upcoming views hold meetings, build sessions, scrimmages, and competitions, layered with the projects, tasks, and polls attached to them. Filter down to one kind of chaos at a time."
        shot={shots.calendarMonth}
      />
      <Teaser
        title="Decide fast. Move on."
        body="Drivetrain A or B? Saturday or Sunday practice? Put it to a vote, watch results land live, and get back to building instead of refereeing a group chat."
        shot={shots.teamPolls}
        flip
      />

      <section className="border-y border-edge bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal className="max-w-2xl">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
              Built by a competitor, not a committee.
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-fg-mid">
              {
                "FTC Flow isn't a corporate tool adapted for robotics. It's built by a student who has lived the scattered-spreadsheet season and wanted better."
              }
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-1.5 font-medium text-signal transition-colors duration-150 hover:text-[#5ba4ff]"
            >
              Read the story
              <svg
                aria-hidden
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="backlight absolute left-1/2 top-1/2 h-[480px] w-[760px] -translate-x-1/2 -translate-y-1/2"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 lg:py-32">
          <Reveal>
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.02em]">
              Be first in line.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-fg-mid">
              The beta lands summer 2026. One email when it opens, one when it
              ships.
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
