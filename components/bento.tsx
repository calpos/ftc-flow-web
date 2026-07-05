import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";
import { GridLayer } from "@/components/substrate";
import { shots } from "@/lib/screenshots";
import type { Screenshot } from "@/lib/screenshots";
import { monoLabel } from "@/lib/ui";

/**
 * The bento: the home page's second rhythm. Secondary features in varied
 * cells (screenshot crops and text moments), so density changes instead of
 * a fourth identical teaser. Cells share the tonal chassis: Surface fill,
 * hairline border, border tint on hover. No shadows, no glow.
 */

function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

type CellProps = {
  className?: string;
  children: ReactNode;
};

function Cell({ className, children }: CellProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[16px] border border-edge bg-surface transition-colors duration-200 hover:border-signal-dim ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

type ShotCellProps = {
  label: string;
  title: string;
  line: string;
  shot: Screenshot;
  /** object-position for the crop, e.g. "50% 8%". */
  position: string;
  className?: string;
};

function ShotCell({ label, title, line, shot, position, className }: ShotCellProps) {
  return (
    <Cell className={className}>
      <div className="p-6 pb-0">
        <p className={`${monoLabel} text-fg-dim`}>{label}</p>
        <h3 className="mt-3 text-lg font-medium leading-snug">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-fg-mid">{line}</p>
      </div>
      <div className="relative mt-6 h-56 overflow-hidden px-6 [mask-image:linear-gradient(to_bottom,black_72%,transparent)]">
        <div className="relative h-full overflow-hidden rounded-t-[16px] border border-b-0 border-edge">
          <Image
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 92vw"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025]"
            style={{ objectPosition: position }}
          />
        </div>
      </div>
    </Cell>
  );
}

export function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
      <Reveal>
        <p className={`${monoLabel} text-fg-dim`}>Also in the box</p>
        <h2 className="mt-4 max-w-xl text-balance text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-[-0.02em]">
          The rest of the console.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <Reveal className="sm:col-span-2 lg:col-span-7">
          <Cell className="flex h-full flex-col justify-between p-6 sm:p-8">
            <GridLayer variant="fade" className="!z-0 opacity-70" />
            <div className="relative">
              <p className={`${monoLabel} text-fg-dim`}>The builder</p>
              <h3 className="mt-4 max-w-md text-balance text-[clamp(1.5rem,2.5vw,1.875rem)] font-medium leading-tight tracking-[-0.01em]">
                Built by a competitor, not a committee.
              </h3>
              <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-fg-mid">
                {
                  "FTC Flow isn't a corporate tool adapted for robotics. It's built by a student who has lived the scattered-spreadsheet season and wanted better."
                }
              </p>
            </div>
            <Link
              href="/about"
              className="relative mt-8 inline-flex items-center gap-1.5 font-medium text-signal transition-colors duration-150 hover:text-[#5ba4ff]"
            >
              Read the story
              <Arrow />
            </Link>
          </Cell>
        </Reveal>

        <Reveal delay={0.06} className="lg:col-span-5">
          <ShotCell
            label="Roster"
            title="Everyone knows their role"
            line="Coach, captain, programmer, CAD, driver: visible to the whole team."
            shot={shots.teamMembers}
            position="50% 14%"
            className="h-full"
          />
        </Reveal>

        <Reveal delay={0.12} className="lg:col-span-4">
          <ShotCell
            label="Agenda"
            title="Next week, already sorted"
            line="The upcoming view turns the calendar into a list you can act on."
            shot={shots.calendarUpcoming}
            position="50% 24%"
            className="h-full"
          />
        </Reveal>

        <Reveal delay={0.18} className="lg:col-span-4">
          <ShotCell
            label="Perspectives"
            title="See it as any teammate"
            line="Switch the active member to check what each role actually sees."
            shot={shots.accounts}
            position="50% 20%"
            className="h-full"
          />
        </Reveal>

        <Reveal delay={0.24} className="lg:col-span-4">
          <Cell className="flex h-full flex-col justify-between p-6 sm:p-8">
            <div>
              <p className={`${monoLabel} text-fg-dim`}>The roadmap</p>
              <h3 className="mt-4 text-balance text-[clamp(1.5rem,2.5vw,1.875rem)] font-medium leading-tight tracking-[-0.01em]">
                Shipping in public.
              </h3>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-fg-mid">
                No invented numbers, no launch theater: what&apos;s done,
                what&apos;s next, and where it&apos;s heading.
              </p>
            </div>
            <Link
              href="/roadmap"
              className="mt-8 inline-flex items-center gap-1.5 font-medium text-signal transition-colors duration-150 hover:text-[#5ba4ff]"
            >
              See the roadmap
              <Arrow />
            </Link>
          </Cell>
        </Reveal>
      </div>
    </section>
  );
}
