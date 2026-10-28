"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { AuthFormState } from "@/lib/auth/types";
import { monoLabel, textInput } from "@/lib/ui";

export const authCard = "rounded-2xl border border-edge bg-surface p-7 sm:p-9";

export const authHeadline =
  "text-[1.75rem] font-medium leading-[1.15] tracking-[-0.01em] text-balance";

/**
 * Headline of a success state that replaces a form. Focused on mount, so
 * keyboard and screen-reader users land on the result, not on <body>.
 */
export function ResultHeadline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h1 ref={ref} tabIndex={-1} className={`${authHeadline} focus:outline-none`}>
      {children}
    </h1>
  );
}

export type FieldName = "email" | "password" | "confirm";
export type FieldValues = Record<FieldName, string>;
export type FieldErrors = NonNullable<AuthFormState["fieldErrors"]>;

/**
 * Controlled values and errors for an auth form. A field is checked on blur,
 * re-checked on every change once it shows an error, and all fields are
 * checked on submit. Field errors from the server replace the local ones each
 * time a new server state arrives.
 */
export function useAuthFields(
  validate: (values: FieldValues) => FieldErrors,
  serverErrors: FieldErrors | undefined,
) {
  const [values, setValues] = useState<FieldValues>({ email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  // Adopt server errors during render (not in an effect) when they change.
  const [seenServerErrors, setSeenServerErrors] = useState(serverErrors);
  if (serverErrors !== seenServerErrors) {
    setSeenServerErrors(serverErrors);
    setErrors(serverErrors ?? {});
  }

  function change(name: FieldName, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    const checked = validate(next);
    // Re-check every field that is showing an error, so fixing the password
    // also clears a stale "Passwords don't match." on the confirm field.
    setErrors((current) => {
      const updated: FieldErrors = {};
      for (const key of Object.keys(current) as FieldName[]) {
        if (current[key]) updated[key] = checked[key];
      }
      return updated;
    });
  }

  function blur(name: FieldName) {
    const message = validate(values)[name];
    setErrors((current) => ({ ...current, [name]: message }));
  }

  /** Blocks the submit (and focuses the first bad field) if any check fails. */
  function checkSubmit(event: FormEvent<HTMLFormElement>) {
    const checked = validate(values);
    const invalid = (Object.keys(checked) as FieldName[]).filter((key) => checked[key]);
    if (invalid.length === 0) return;
    event.preventDefault();
    setErrors(checked);
    event.currentTarget.querySelector<HTMLInputElement>(`[name="${invalid[0]}"]`)?.focus();
  }

  function clear(names: FieldName[]) {
    setValues((current) => {
      const next = { ...current };
      for (const name of names) next[name] = "";
      return next;
    });
    setErrors({});
  }

  return { values, errors, change, blur, checkSubmit, clear };
}

export function AuthField({
  id,
  name,
  label,
  type,
  autoComplete,
  value,
  error,
  hint,
  aside,
  onChange,
  onBlur,
}: {
  id: string;
  name: FieldName;
  label: string;
  type: "email" | "password";
  autoComplete: string;
  value: string;
  error?: string;
  hint?: string;
  aside?: ReactNode;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className={`${monoLabel} block text-fg-dim`}>
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${textInput} mt-2`}
      />
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-sm text-fg-dim">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** Form-level error from the server, announced when it appears. */
export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-[10px] border border-danger/40 bg-raised px-4 py-3 text-sm leading-relaxed text-danger"
    >
      {children}
    </div>
  );
}
