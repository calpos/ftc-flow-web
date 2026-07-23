import type { Metadata } from "next";
import { StoreProvider } from "@/lib/beta/StoreProvider";
import { BetaShell } from "./_components/BetaShell";

export const metadata: Metadata = {
  title: {
    default: 'Local Alpha — FTC Flow',
    template: '%s · FTC Flow Local Alpha',
  },
  description:
    "Try every FTC Flow feature in your browser. Runs locally, no account needed.",
  robots: { index: false, follow: false },
};

export default function BetaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoreProvider>
      <BetaShell>{children}</BetaShell>
    </StoreProvider>
  );
}
