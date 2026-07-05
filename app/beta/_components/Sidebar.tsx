"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Home,
  RotateCcw,
  Users,
  type LucideIcon,
} from "lucide-react";
import { MOCK_TEAM_NAME, MOCK_TEAM_NUMBER } from "@/lib/beta/mocks";
import { resetBetaData } from "@/lib/beta/storage";
import { PerspectiveSwitcher } from "./PerspectiveSwitcher";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/beta", label: "Home", icon: Home },
  { href: "/beta/team", label: "Team", icon: Users },
  { href: "/beta/calendar", label: "Calendar", icon: Calendar },
  { href: "/beta/account", label: "Account", icon: Users },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/beta") return pathname === "/beta";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Brand + team */}
      <div className="px-4 pb-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-fg">FTC Flow</span>
          <span className="rounded-md bg-signal-dim px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-signal">
            Local Alpha
          </span>
        </div>
        <p className="mt-2 text-sm text-fg-dim">
          Team {MOCK_TEAM_NUMBER} · <span className="text-fg-mid">{MOCK_TEAM_NAME}</span>
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-signal-dim/60 text-signal"
                  : "text-fg-mid hover:bg-raised hover:text-fg"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer: perspective + reset */}
      <div className="space-y-2 border-t border-edge p-3">
        <PerspectiveSwitcher direction="up" />
        <button
          type="button"
          onClick={async () => {
            await resetBetaData();
            window.location.reload();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] px-3 py-2 text-xs font-medium text-fg-dim transition-colors hover:bg-raised hover:text-fg"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset demo data
        </button>
      </div>
    </div>
  );
}
