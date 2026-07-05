"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, Users, Calendar, CircleUser, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { getEventTypeColor, getEventTypeLabel } from "@/lib/beta/types";
import { Pill } from "./ui";

const STATIC_PAGES: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/beta", label: "Home", icon: Home },
  { href: "/beta/team", label: "Team", icon: Users },
  { href: "/beta/calendar", label: "Calendar", icon: Calendar },
  { href: "/beta/account", label: "Account", icon: CircleUser },
];

type Group = "Pages" | "Projects" | "Tasks" | "Polls" | "Members" | "Events";

interface Result {
  id: string;
  label: string;
  href: string;
  group: Group;
  icon?: LucideIcon;
  pillLabel?: string;
  pillColor?: string;
}

function sub(text: string, q: string): boolean {
  return text.toLowerCase().includes(q.toLowerCase());
}

function prefixScore(text: string, q: string): number {
  return text.toLowerCase().startsWith(q.toLowerCase()) ? 0 : 1;
}

function CommandPaletteInner({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { tasks, taskItems, polls, members, events } = useApp();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(id);
  }, []);

  const q = query.trim();

  const results: Result[] = q
    ? [
        ...STATIC_PAGES.filter((p) => sub(p.label, q))
          .sort((a, b) => prefixScore(a.label, q) - prefixScore(b.label, q))
          .map((p): Result => ({ id: `page-${p.href}`, label: p.label, href: p.href, group: "Pages", icon: p.icon })),
        ...tasks
          .filter((t) => sub(t.name, q))
          .sort((a, b) => prefixScore(a.name, q) - prefixScore(b.name, q))
          .map((t): Result => ({ id: `proj-${t.id}`, label: t.name, href: "/beta/team?tab=projects", group: "Projects", pillLabel: "Project", pillColor: t.color })),
        ...taskItems
          .filter((t) => sub(t.title, q))
          .sort((a, b) => prefixScore(a.title, q) - prefixScore(b.title, q))
          .map((t): Result => ({ id: `task-${t.id}`, label: t.title, href: "/beta/team?tab=tasks", group: "Tasks", pillLabel: "Task", pillColor: t.color })),
        ...polls
          .filter((p) => sub(p.question, q))
          .sort((a, b) => prefixScore(a.question, q) - prefixScore(b.question, q))
          .map((p): Result => ({ id: `poll-${p.id}`, label: p.question, href: "/beta/team?tab=polls", group: "Polls", pillLabel: "Poll", pillColor: p.color })),
        ...members
          .filter((m) => sub(`${m.firstName} ${m.lastName}`, q))
          .sort((a, b) => prefixScore(`${a.firstName} ${a.lastName}`, q) - prefixScore(`${b.firstName} ${b.lastName}`, q))
          .map((m): Result => ({ id: `member-${m.id}`, label: `${m.firstName} ${m.lastName}`, href: "/beta/team?tab=members", group: "Members", pillLabel: "Member", pillColor: "#6B6B80" })),
        ...events
          .filter((e) => sub(e.title, q))
          .sort((a, b) => prefixScore(a.title, q) - prefixScore(b.title, q))
          .map((e): Result => ({ id: `event-${e.id}`, label: e.title, href: "/beta/calendar", group: "Events", pillLabel: getEventTypeLabel(e.type), pillColor: getEventTypeColor(e.type) })),
      ]
    : STATIC_PAGES.map((p): Result => ({ id: `page-${p.href}`, label: p.label, href: p.href, group: "Pages", icon: p.icon }));

  function navigate(item: Result) {
    router.push(item.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % Math.max(results.length, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + Math.max(results.length, 1)) % Math.max(results.length, 1));
        break;
      case "Enter":
        e.preventDefault();
        e.stopPropagation();
        if (results[selectedIndex]) navigate(results[selectedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        onClose();
        break;
      case "Tab": {
        e.preventDefault();
        const overlay = overlayRef.current;
        if (!overlay) break;
        const focusable = Array.from(
          overlay.querySelectorAll<HTMLElement>(
            'button, input, a[href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) break;
        const current = document.activeElement as HTMLElement;
        const fi = focusable.indexOf(current);
        if (e.shiftKey) {
          const prev = fi <= 0 ? focusable[focusable.length - 1] : focusable[fi - 1];
          prev?.focus();
        } else {
          const next = fi === -1 || fi === focusable.length - 1 ? focusable[0] : focusable[fi + 1];
          next?.focus();
        }
        break;
      }
    }
  }

  const grouped: { group: Group; items: { result: Result; idx: number }[] }[] = [];
  results.forEach((result, idx) => {
    const existing = grouped.find((g) => g.group === result.group);
    if (existing) {
      existing.items.push({ result, idx });
    } else {
      grouped.push({ group: result.group, items: [{ result, idx }] });
    }
  });

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative z-10 mx-auto mt-[15vh] w-full max-w-xl rounded-2xl border border-edge bg-surface shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-edge">
          <Search className="h-5 w-5 text-fg-dim shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Search pages and team data..."
            className="flex-1 bg-transparent text-base text-fg placeholder:text-fg-dim outline-none"
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && q ? (
            <p className="py-8 text-center text-sm text-fg-dim">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group}>
                <div className="px-5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-fg-dim bg-surface">
                  {group}
                </div>
                {items.map(({ result, idx }) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      className={`flex w-full items-center gap-3 px-5 py-2.5 cursor-pointer text-sm text-left transition-colors ${
                        idx === selectedIndex ? "bg-raised" : "hover:bg-raised"
                      }`}
                      onClick={() => navigate(result)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4 shrink-0 text-fg-dim" />
                      ) : (
                        <Pill label={result.pillLabel ?? group} color={result.pillColor} />
                      )}
                      <span className="flex-1 truncate">{result.label}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prevFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      prevFocusRef.current = document.activeElement;
    } else {
      if (prevFocusRef.current instanceof HTMLElement) {
        prevFocusRef.current.focus();
      }
    }
  }, [open]);

  if (!open) return null;
  return <CommandPaletteInner onClose={onClose} />;
}
