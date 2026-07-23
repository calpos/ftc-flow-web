"use client";

import React, { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

const FOCUSABLE_SELECTORS =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function BetaShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Esc to close — only bind while open
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Body scroll lock with cleanup
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Focus first focusable element when panel opens
  useEffect(() => {
    if (!menuOpen || !panelRef.current) return;
    const el = panelRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    el?.focus();
  }, [menuOpen]);

  // Return focus to toggle button on any close path
  useEffect(() => {
    if (wasOpen.current && !menuOpen) {
      toggleRef.current?.focus();
    }
    wasOpen.current = menuOpen;
  }, [menuOpen]);

  // Inline focus trap: cycle Tab/Shift+Tab within the panel
  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const els = Array.from<HTMLElement>(
      panelRef.current.querySelectorAll(FOCUSABLE_SELECTORS)
    );
    if (els.length === 0) return;
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const dur = reducedMotion ? "0s" : "0.25s";

  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, []);

  return (
    <div className="flex min-h-screen">
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-edge bg-surface lg:block">
        <Sidebar onOpenPalette={() => setPaletteOpen(true)} />
      </aside>

      {/* Mobile drawer — always mounted; transitions driven by menuOpen state */}
      <div
        className="fixed inset-0 z-40 lg:hidden"
        style={{ pointerEvents: menuOpen ? "auto" : "none" }}
      >
        {/* Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
          style={{ opacity: menuOpen ? 1 : 0, transition: `opacity ${dur} ease` }}
        />
        {/* Panel */}
        <div
          ref={panelRef}
          id="mobile-nav-panel"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          {...(!menuOpen ? { inert: '' } : {})}
          className="absolute inset-y-0 left-0 w-72 border-r border-edge bg-surface"
          style={{
            transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
            transition: `transform ${dur} ease`,
          }}
          onKeyDown={handlePanelKeyDown}
        >
          <Sidebar onNavigate={() => setMenuOpen(false)} onOpenPalette={() => setPaletteOpen(true)} />
        </div>
      </div>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-edge bg-ink/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold tracking-tight">FTC Flow</span>
            <span className="rounded-md bg-signal-dim px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-signal">
              Beta
            </span>
          </div>
          <button
            ref={toggleRef}
            id="mobile-nav-toggle"
            type="button"
            onClick={() => setMenuOpen((o: boolean) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
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
          FTC Flow local alpha · data is stored only in this browser ·{" "}
          <Link href="/" className="text-fg-mid underline-offset-2 hover:underline">
            Back to site
          </Link>
        </footer>
      </div>
    </div>
  );
}
