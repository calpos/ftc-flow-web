"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
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

export function Sidebar({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Section A - Brand header */}
      {collapsed ? (
        <div className="h-8 px-2 pb-4 pt-5" />
      ) : (
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
      )}

      {/* Section B - Nav links */}
      <nav className="flex-1 space-y-1 px-3">
        {collapsed
          ? NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <div key={label} className="relative group w-full">
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-label={label}
                    aria-current={active ? "page" : undefined}
                    title={label}
                    className={`flex items-center justify-center rounded-[10px] p-2.5 transition-colors ${
                      active
                        ? "bg-signal-dim/60 text-signal"
                        : "text-fg-mid hover:bg-raised hover:text-fg"
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </Link>
                  <div aria-hidden="true" className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-xs font-medium text-fg shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100 motion-reduce:transition-none">
                    {label}
                  </div>
                </div>
              );
            })
          : NAV.map(({ href, label, icon: Icon }) => {
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

        {/* Section C - Toggle button */}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            className={`flex items-center rounded-[10px] px-3 py-2 text-xs font-medium text-fg-dim transition-colors hover:bg-raised hover:text-fg ${
              collapsed ? "w-full justify-center" : ""
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1.5" />
                Collapse
              </>
            )}
          </button>
        )}
      </nav>

      {/* Section D - Footer */}
      <div className="space-y-2 border-t border-edge p-3">
        {collapsed ? null : <PerspectiveSwitcher direction="up" />}
        {collapsed ? (
          <div className="relative group w-full">
            <button
              type="button"
              onClick={async () => {
                await resetBetaData();
                window.location.reload();
              }}
              aria-label="Reset demo data"
              className="flex w-full items-center justify-center rounded-[10px] px-3 py-2 text-xs font-medium text-fg-dim transition-colors hover:bg-raised hover:text-fg"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <div aria-hidden="true" className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-xs font-medium text-fg shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-100 motion-reduce:transition-none">
              Reset demo data
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
