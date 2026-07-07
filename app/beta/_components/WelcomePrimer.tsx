"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "ftcflow_beta_welcomed";

export function WelcomePrimer() {
  // null = not yet checked; SSR always outputs nothing to avoid hydration mismatch
  const [show, setShow] = useState<boolean | null>(null);

  useEffect(() => {
    startTransition(() => {
      setShow(localStorage.getItem(STORAGE_KEY) !== '1');
    });
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  }

  if (show !== true) return null;

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
      <section
        aria-label="Welcome guide"
        className="relative rounded-2xl border border-l-2 border-edge border-l-signal bg-surface px-4 py-5 sm:px-6"
        style={{ animation: "fadeSlideIn 0.25s ease-out" }}
      >
        <button
          type="button"
          aria-label="Dismiss welcome guide"
          onClick={dismiss}
          className="absolute right-4 top-4 text-fg-dim transition-colors hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="pr-8 text-sm font-semibold text-fg">You&apos;re in the interactive preview</h2>

        <ul className="mt-3 space-y-2 text-sm text-fg-mid">
          <li>Everything on screen is interactive and freely editable — click any card, task, event, or poll to open and edit it.</li>
          <li>Nothing is uploaded or visible to anyone else. All changes live only in this browser.</li>
          <li>
            You can return to the original sample state at any time —{" "}
            <span className="font-medium text-fg">Reset demo data</span> is at the bottom of the
            sidebar or on the Account page.
          </li>
        </ul>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <TryThisTip
            href="/beta/account"
            label="Switch perspective"
            detail={`Go to Account → "Viewing as" to see the dashboard from any team member's point of view.`}
          />
          <TryThisTip
            href="/beta/team?tab=tasks"
            label="Open any task or project"
            detail="Head to Team → Tasks or Projects, click a card, and edit fields, change assignees, or mark it complete."
          />
        </div>
      </section>
    </>
  );
}

function TryThisTip({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="min-w-0 flex-1 rounded-xl border border-edge bg-raised/40 px-3.5 py-2.5 text-sm transition-colors hover:border-signal-dim"
    >
      <span className="font-medium text-fg">{label}</span>
      <span className="text-fg-dim"> — {detail}</span>
    </Link>
  );
}
