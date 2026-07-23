"use client";

import { ReactNode, useState } from "react";
import { Check, Search } from "lucide-react";
import { TeamMember } from "@/lib/beta/types";
import { Avatar } from "./ui";

export const inputBase =
  "h-11 w-full rounded-[10px] border border-edge bg-raised px-3.5 text-sm text-fg placeholder:text-fg-dim transition-colors focus:border-signal focus:outline-none";

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className = "",
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label ? (
        <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-fg-mid">
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className="mt-1.5 text-xs text-fg-dim">{hint}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  id,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputBase}
      />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  id,
  rows = 3,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  rows?: number;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-y rounded-[10px] border border-edge bg-raised px-3.5 py-2.5 text-sm leading-relaxed text-fg placeholder:text-fg-dim transition-colors focus:border-signal focus:outline-none"
      />
    </Field>
  );
}

export function DateField({
  label,
  value,
  onChange,
  id,
  hint,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  id?: string;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} [color-scheme:dark]`}
      />
    </Field>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  id,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  id?: string;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} [color-scheme:dark]`}
      />
    </Field>
  );
}

export function ColorPicker({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap items-center gap-2.5">
        {options.map((c) => {
          const active = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-label={`Select color ${c}`}
              aria-pressed={active}
              className={`grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-110 ${
                active ? "ring-2 ring-fg ring-offset-2 ring-offset-surface" : ""
              }`}
              style={{ backgroundColor: c }}
            >
              {active ? <Check className="h-4 w-4 text-ink" /> : null}
            </button>
          );
        })}
        <label
          className="grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-edge"
          title="Custom color"
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>
      </div>
    </Field>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[10px] border border-edge bg-raised px-3.5 py-3 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-fg-dim">{description}</span>
        ) : null}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-signal" : "bg-edge"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-fg transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function RangeField({
  label,
  value,
  onChange,
  color = "#2D8CFF",
}: {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-raised accent-signal"
          style={{ accentColor: color }}
        />
        <span className="w-10 text-right text-sm font-medium tabular-nums text-fg">
          {Math.round(value)}%
        </span>
      </div>
    </Field>
  );
}

/** Multi-select list of team members with avatars, search, and bulk actions. */
export function MemberMultiSelect({
  label,
  members,
  selected,
  onToggle,
}: {
  label?: string;
  members: TeamMember[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? members.filter((m) => {
        const name = `${m.firstName} ${m.lastName}`.toLowerCase();
        const role = m.isCoach
          ? "coach"
          : `${m.teamRole}${m.grade ? ` · ${m.grade}` : ""}`.toLowerCase();
        return name.includes(q) || role.includes(q);
      })
    : members;

  return (
    <Field label={label}>
      <div className="relative mb-2">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <Search className="h-3.5 w-3.5 text-fg-dim" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members…"
          aria-label="Search members"
          className={`${inputBase} h-9 pl-8`}
        />
      </div>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-fg-dim">
          {selected.length} of {members.length} selected
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              filtered.forEach((m) => {
                if (!selected.includes(m.id)) onToggle(m.id);
              });
            }}
            className="text-xs font-medium text-signal"
          >
            {q ? `Select all (${filtered.length})` : "Select all"}
          </button>
          <button
            type="button"
            onClick={() => {
              [...selected].forEach((id) => onToggle(id));
            }}
            className="text-xs font-medium text-signal"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-4 text-center text-xs text-fg-dim">
            No members match your search
          </div>
        ) : (
          filtered.map((m) => {
            const isOn = selected.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onToggle(m.id)}
                aria-pressed={isOn}
                className={`flex items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition-colors ${
                  isOn
                    ? "border-signal bg-signal-dim/40"
                    : "border-edge bg-raised hover:border-signal-dim"
                }`}
              >
                <Avatar member={m} size={28} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-fg">
                    {m.firstName} {m.lastName}
                  </span>
                  <span className="block truncate text-xs text-fg-dim">
                    {m.isCoach
                      ? "Coach"
                      : `${m.teamRole}${m.grade ? ` · ${m.grade}` : ""}`}
                  </span>
                </span>
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                    isOn ? "border-signal bg-signal text-ink" : "border-edge"
                  }`}
                >
                  {isOn ? <Check className="h-3.5 w-3.5" /> : null}
                </span>
              </button>
            );
          })
        )}
      </div>
    </Field>
  );
}
