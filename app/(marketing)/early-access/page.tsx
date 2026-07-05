import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { SubscribeForm } from "@/components/subscribe-form";
import { GridLayer } from "@/components/substrate";
import { buttonPrimary, monoLabel } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Early Access",
  description:
    "Join the FTC Flow mailing list for the TestFlight beta and App Store launch. Accounts arrive with the web portal at beta.ftcflow.app.",
  alternates: { canonical: "/early-access" },
};

export default function EarlyAccessPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
      />
      <GridLayer variant="top" />
      <div className="mx-auto max-w-5xl px-5 pb-24 pt-16 sm:px-8 lg:pt-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className={`${monoLabel} text-fg-dim`}>Early access</p>
        <h1 className="mt-5 text-balance text-[clamp(2.25rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.02em]">
          Coming Fall 2026
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-fg-mid">
          FTC Flow ships to the App Store at the start of the 2026-27 season,
          after a summer of TestFlight testing with real teams. Two ways to be
          early:
        </p>
      </Reveal>

      <Reveal delay={0.04} className="mx-auto mt-10 max-w-2xl text-center">
        <Link href="/beta" className={buttonPrimary}>
          Access local beta
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
        <p className="mt-3 text-sm text-fg-dim">
          Try every feature in your browser right now — no account needed. Runs
          locally on this device.
        </p>
      </Reveal>

      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        <Reveal delay={0.08}>
          <section className="h-full rounded-2xl border border-edge bg-surface p-7 transition-colors duration-200 hover:border-signal-dim sm:p-9">
            <h2 className="text-xl font-medium">Get the launch email</h2>
            <p className="mt-3 leading-relaxed text-fg-mid">
              One email when the TestFlight beta opens, one when FTC Flow hits
              the App Store. Nothing else, ever.
            </p>
            <div className="mt-7">
              <SubscribeForm />
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.16}>
          <section className="h-full rounded-2xl border border-edge bg-surface p-7 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl font-medium">
                Create your FTC Flow account
              </h2>
              <span className="inline-flex shrink-0 items-center rounded-md bg-signal-dim px-2.5 py-1 text-xs font-medium uppercase tracking-[0.08em] text-signal">
                Coming soon
              </span>
            </div>
            <p className="mt-3 leading-relaxed text-fg-mid">
              {
                "Accounts arrive with the web portal at beta.ftcflow.app: every app feature in the browser, synced with your phone. There's nothing to sign into yet, and we won't pretend otherwise."
              }
            </p>
            <div className="mt-7">
              <label
                htmlFor="account-email"
                className={`${monoLabel} block text-fg-dim`}
              >
                Email
              </label>
              <input
                id="account-email"
                type="email"
                disabled
                placeholder="you@team.org"
                className="mt-2 h-12 w-full cursor-not-allowed rounded-[10px] border border-edge bg-raised/50 px-4 text-fg-dim placeholder:text-fg-dim/60"
              />
              <button
                type="button"
                disabled
                className="mt-4 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-[10px] border border-edge bg-raised/50 px-6 font-medium text-fg-dim"
              >
                Coming soon
              </button>
            </div>
          </section>
        </Reveal>
      </div>
      </div>
    </div>
  );
}
