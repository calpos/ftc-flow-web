"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import { FormAlert, authHeadline } from "@/app/(auth)/_components/fields";
import { friendlyError } from "@/lib/supabase/errors";
import { monoLabel, textInput } from "@/lib/ui";
import { clearSavedTeam } from "../_lib/savedTeam";
import { describedBy } from "./useFormFields";

/**
 * A step's h1. Focused on mount when `focus` is set (after moving from one
 * step to the next), so keyboard and screen-reader users land on the new
 * step instead of <body>. Not on first load, where focus starts at the top.
 */
export function StepHeading({ focus, children }: { focus: boolean; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  return (
    <h1 ref={ref} tabIndex={-1} className={`${authHeadline} focus:outline-none`}>
      {children}
    </h1>
  );
}

/** The error under a field, or its hint when there is no error. */
export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="mt-2 text-sm text-danger">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-2 text-sm text-fg-dim">
        {hint}
      </p>
    );
  }
  return null;
}

export function TextField({
  id,
  name,
  label,
  value,
  error,
  hint,
  autoComplete,
  autoCapitalize,
  inputMode,
  placeholder,
  inputClassName = "",
  onChange,
  onBlur,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  autoComplete: string;
  autoCapitalize?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  inputClassName?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className={`${monoLabel} block text-fg-dim`}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        autoComplete={autoComplete}
        autoCapitalize={autoCapitalize}
        inputMode={inputMode}
        placeholder={placeholder}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, Boolean(hint))}
        className={`${textInput} mt-2 ${inputClassName}`}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

/**
 * The copy setActiveTeam returns when the session is gone. It returns only
 * copy, so this is how a caller knows to offer the sign-in link.
 */
export const SIGNED_OUT_ERROR = friendlyError({ code: "P0001", message: "not_authenticated" });

/**
 * A failed action's form-level error. When the session is gone, it links to
 * sign-in with a `next` that brings the user back to this step. `children`
 * follow the message (e.g. a way onward).
 */
export function ActionAlert({
  error,
  signedOut,
  signInNext,
  children,
}: {
  error: string;
  signedOut?: boolean;
  signInNext: string;
  children?: ReactNode;
}) {
  return (
    <FormAlert>
      {error}
      {signedOut ? (
        <>
          {" "}
          <a
            href={`/login?next=${encodeURIComponent(signInNext)}`}
            className="font-medium underline underline-offset-2"
          >
            Go to sign in.
          </a>
        </>
      ) : null}
      {children}
    </FormAlert>
  );
}

/**
 * The plain link out of onboarding: a full load, so /beta's server state is
 * fresh. Leaving ends the flow, so a saved created screen goes with it.
 */
export function OpenAppAnyway() {
  return (
    <>
      {" "}
      <a href="/beta" onClick={clearSavedTeam} className="font-medium underline underline-offset-2">
        Open FTC Flow anyway
      </a>
    </>
  );
}
