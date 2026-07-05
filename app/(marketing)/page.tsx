import type { Metadata } from "next";
import Link from "next/link";
import { Bento } from "@/components/bento";
import { Hero } from "@/components/hero";
import { Reveal } from "@/components/reveal";
import { GridLayer, SectionRule } from "@/components/substrate";
import { Walkthrough } from "@/components/walkthrough";
import { buttonPrimary, monoLabel } from "@/lib/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />

      <SectionRule />
      <Walkthrough />

      <SectionRule />
      <Bento />

      <SectionRule />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="backlight absolute left-1/2 top-1/2 h-[540px] w-[860px] -translate-x-1/2 -translate-y-1/2"
        />
        <GridLayer variant="fade" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 text-center sm:px-8 lg:py-36">
          <Reveal>
            <p className={`${monoLabel} text-fg-dim`}>
              TestFlight beta · Summer 2026
            </p>
            <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-tight tracking-[-0.02em]">
              Be first in line.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[1.0625rem] leading-relaxed text-fg-mid">
              One email when the beta opens, one when it ships. Nothing else,
              ever.
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
