import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { Spotlight } from "@/components/spotlight";
import { GridLayer } from "@/components/substrate";
import { CONTACT_EMAIL } from "@/lib/site";
import { buttonPrimary, monoLabel } from "@/lib/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why a high school FTC competitor built FTC Flow, and what shipping it in public looks like.",
  alternates: { canonical: "/about" },
};

const painPoints = [
  {
    label: "The group chat",
    line: "Moves too fast to be a record. The answer is always forty messages up.",
  },
  {
    label: "The spreadsheet",
    line: "Accurate the week it was made. Nobody updates it after that.",
  },
  {
    label: "Someone's memory",
    line: "The best system on the team, until they graduate.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />
      <GridLayer variant="top" />
      <article className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
        <Reveal>
          <p className={`${monoLabel} text-fg-dim`}>The builder</p>
          <h1 className="mt-5 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
            I built the tool my team needed.
          </h1>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="mt-10 max-w-[40rem] text-[1.0625rem] leading-relaxed text-fg-mid">
            {
              "I'm Calvin Posillico. I've spent the last three years competing in FIRST Tech Challenge, and for most of that time my team's coordination lived in three places at once:"
            }
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {painPoints.map((point) => (
              <Spotlight
                key={point.label}
                className="rounded-[16px] border border-edge bg-surface p-5"
              >
                <p className={`${monoLabel} text-fg-dim`}>{point.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-fg-mid">
                  {point.line}
                </p>
              </Spotlight>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 max-w-[40rem] space-y-6 text-[1.0625rem] leading-relaxed text-fg-mid">
            <p>
              {
                "Every season, the same pattern. Who's bringing the battery charger? Which drivetrain did we decide on? When's the scrimmage? The answers existed, somewhere. Finding them cost time we didn't have, and every misplaced answer turned into a missed task or a duplicated one."
              }
            </p>
            <p>
              {
                "Then the season ends, seniors graduate, and everything they knew walks out the door with them. The next season starts from scratch."
              }
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <blockquote className="my-14 border-y border-edge py-10">
            <p className="text-balance text-center text-[clamp(1.5rem,3vw,2rem)] font-medium leading-snug tracking-[-0.01em] text-fg">
              Knowledge that took years to build evaporates over one summer.
            </p>
          </blockquote>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="max-w-[40rem] space-y-6 text-[1.0625rem] leading-relaxed text-fg-mid">
            <p>
              {
                "FTC Flow is the tool I wished we had: tasks, projects, the season calendar, and team decisions in one calm place, scoped so each person sees what they own. On your phone and in the browser, synced. Nothing clever. Just the coordination layer, done properly."
              }
            </p>
            <p>
              {
                "I'm building it solo and shipping in public. The beta lands in August 2026, on TestFlight and the web, with real teams; the full release follows in September. If your team runs on scattered chats and good intentions, I'd like to change that."
              }
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.28}>
          <div className="mt-10 flex flex-wrap gap-2">
            {["3 seasons of FTC", "Built solo", "Shipping in public"].map(
              (fact) => (
                <span
                  key={fact}
                  className="rounded-md border border-edge bg-raised px-3 py-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-fg-mid"
                >
                  {fact}
                </span>
              ),
            )}
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <Spotlight className="mt-14 rounded-2xl border border-edge bg-surface transition-colors duration-200 hover:border-signal-dim">
            <div className="p-7 sm:p-9">
              <h2 className="text-xl font-medium">Get in touch</h2>
              <p className="mt-2 max-w-[32rem] leading-relaxed text-fg-mid">
                Questions, feedback, or want your team in the beta?
              </p>
              <p className="mt-1.5">
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-medium text-signal transition-colors duration-150 hover:text-[#5ba4ff]"
                >
                  {CONTACT_EMAIL}
                </a>
              </p>
              <Link href="/early-access" className={`${buttonPrimary} mt-7`}>
                Get Early Access
              </Link>
            </div>
          </Spotlight>
        </Reveal>
      </article>
    </div>
  );
}
