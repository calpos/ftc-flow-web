import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Grain, GridLayer } from "@/components/substrate";

export const metadata: Metadata = {
  title: "Get started",
  robots: { index: false, follow: false },
};

// Static chrome only, same as app/(auth)/layout.tsx: no cookie or session
// reads here, so the page alone decides whether it renders per request.
export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Grain />
      <header className="border-b border-edge">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="FTC Flow home"
          >
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-[1.0625rem] font-medium tracking-tight">
              FTC Flow
            </span>
          </Link>
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden">
        <div
          aria-hidden
          className="bleed-top pointer-events-none absolute inset-x-0 top-0 h-[360px]"
        />
        <GridLayer variant="top" />
        <main
          id="main"
          className="mx-auto w-full max-w-[28rem] px-5 pb-24 pt-12 sm:px-0 sm:pt-20"
        >
          {children}
        </main>
      </div>
    </>
  );
}
