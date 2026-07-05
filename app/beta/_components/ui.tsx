"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Search, X } from "lucide-react";
import {
  TeamMember,
  getProgressLabel,
  getProgressLabelColor,
} from "@/lib/beta/types";

/* ----------------------------------------------------------------- Avatar */

export function initialsOf(member: Pick<TeamMember, "firstName" | "lastName">): string {
  return `${member.firstName[0] ?? ""}${member.lastName[0] ?? ""}`.toUpperCase();
}

export function Avatar({
  member,
  size = 36,
  ring = false,
}: {
  member: Pick<TeamMember, "firstName" | "lastName">;
  size?: number;
  ring?: boolean;
}) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-raised font-medium text-signal ${
        ring ? "ring-2 ring-surface" : ""
      }`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initialsOf(member)}
    </span>
  );
}

/** Overlapping avatar stack with a +N overflow chip. */
export function AvatarStack({
  members,
  max = 4,
  size = 24,
}: {
  members: TeamMember[];
  max?: number;
  size?: number;
}) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <span key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar member={m} size={size} ring />
        </span>
      ))}
      {extra > 0 ? (
        <span
          className="grid place-items-center rounded-full bg-raised text-[10px] font-medium text-fg-mid ring-2 ring-surface"
          style={{ width: size, height: size, marginLeft: -8 }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------- Pill */

export function Pill({
  label,
  color = "#2D8CFF",
  className = "",
}: {
  label: ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {label}
    </span>
  );
}

/** Colored progress-stage label derived from a 0-100 progress value. */
export function StageBadge({ progress }: { progress: number }) {
  const label = getProgressLabel(progress);
  const color = getProgressLabelColor(label);
  return (
    <span className="text-xs font-medium" style={{ color }}>
      {label}
    </span>
  );
}

/* ----------------------------------------------------------- ProgressBar */

export function ProgressBar({
  value,
  color = "#2D8CFF",
  className = "",
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-raised ${className}`}>
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* --------------------------------------------------------- SegmentedTabs */

export interface TabOption<T extends string> {
  label: string;
  value: T;
  count?: number;
}

export function SegmentedTabs<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex flex-wrap gap-1 rounded-xl border border-edge bg-surface p-1 ${className}`}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-raised text-fg"
                : "text-fg-mid hover:text-fg"
            }`}
          >
            {o.label}
            {o.count != null ? (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-signal-dim text-signal" : "bg-raised text-fg-dim"
                }`}
              >
                {o.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------- Buttons */

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-signal text-ink hover:bg-[#4d9dff] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "border border-edge bg-raised text-fg hover:border-signal-dim disabled:cursor-not-allowed disabled:opacity-50",
  ghost: "text-fg-mid hover:bg-raised hover:text-fg",
  danger:
    "border border-danger/40 bg-transparent text-danger hover:bg-danger/10",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-medium transition-colors duration-150 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className = "",
  active = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border transition-colors ${
        active
          ? "border-signal bg-signal-dim text-signal"
          : "border-edge bg-surface text-fg-mid hover:text-fg"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------- SearchInput */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex h-10 flex-1 items-center gap-2 rounded-[10px] border border-edge bg-surface px-3">
      <Search className="h-4 w-4 shrink-0 text-fg-dim" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-dim focus:outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="grid h-5 w-5 place-items-center rounded text-fg-dim hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge px-6 py-16 text-center">
      {icon ? (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-signal-dim text-signal">
          {icon}
        </div>
      ) : null}
      <p className="font-medium text-fg-mid">{title}</p>
      {subtitle ? <p className="mt-1 max-w-sm text-sm text-fg-dim">{subtitle}</p> : null}
    </div>
  );
}

/* ------------------------------------------------------------- Card shell */

export function Card({
  children,
  className = "",
  onClick,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "div" | "button";
}) {
  const base =
    "rounded-2xl border border-edge bg-surface transition-colors";
  if (as === "button" || onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} text-left hover:border-signal-dim ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{children}</div>;
}
