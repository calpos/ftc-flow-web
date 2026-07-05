"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function BetaShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-edge bg-surface lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-edge bg-surface">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      ) : null}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-edge bg-ink/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">FTC Flow</span>
            <span className="rounded-md bg-signal-dim px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-signal">
              Beta
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid h-9 w-9 place-items-center rounded-lg text-fg-mid hover:bg-raised hover:text-fg"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        <main id="main" className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            {children}
          </div>
        </main>

        <footer className="border-t border-edge px-4 py-5 text-center text-xs text-fg-dim sm:px-6 lg:px-10">
          FTC Flow local beta · data is stored only in this browser ·{" "}
          <Link href="/" className="text-fg-mid underline-offset-2 hover:underline">
            Back to site
          </Link>
        </footer>
      </div>
    </div>
  );
}
