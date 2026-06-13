import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { CONTACT_EMAIL } from "@/lib/site";
import { buttonPrimary } from "@/lib/ui";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why a high school FTC competitor built FTC Flow, and what shipping it in public looks like.",
  alternates: { canonical: "/about" },
};

const paragraphs: readonly string[] = [
  "I'm Calvin Posillico. I've spent the last three years competing in FIRST Tech Challenge, and for most of that time my team's coordination lived in three places at once: a group chat that moved too fast, a spreadsheet nobody updated, and someone's memory.",
  "Every season, the same pattern. Who's bringing the battery charger? Which drivetrain did we decide on? When's the scrimmage? The answers existed, somewhere. Finding them cost time we didn't have, and every misplaced answer turned into a missed task or a duplicated one.",
  "Then the season ends, seniors graduate, and everything they knew walks out the door with them. The next season starts from scratch. Knowledge that took years to build evaporates over one summer.",
  "FTC Flow is the tool I wished we had: tasks, projects, the season calendar, and team decisions in one calm place, scoped so each person sees what they own. Nothing clever. Just the coordination layer, done properly.",
  "I'm building it solo and shipping in public. The beta hits TestFlight this summer with real teams, then the App Store this fall. If your team runs on scattered chats and good intentions, I'd like to change that.",
];

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
      <Reveal>
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
          I built the tool my team needed.
        </h1>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="mt-10 max-w-[40rem] space-y-6 text-[1.0625rem] leading-relaxed text-fg-mid">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </Reveal>
      <Reveal delay={0.12}>
        <div className="mt-14 rounded-2xl border border-edge bg-surface p-7 sm:p-9">
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
      </Reveal>
    </article>
  );
}
