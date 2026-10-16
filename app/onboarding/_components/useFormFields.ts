"use client";

import { useState } from "react";
import { firstInvalid } from "../_lib/validation";
import type { FieldErrors } from "../_lib/types";

/**
 * Controlled values and errors for an onboarding form, with the same rules as
 * useAuthFields in app/(auth)/_components/fields.tsx: a field is checked on
 * blur, re-checked on every change once it shows an error, and every field is
 * checked on submit. `validate` must return its keys in form order.
 */
export function useFormFields<F extends string>(
  initial: Record<F, string>,
  validate: (values: Record<F, string>) => FieldErrors<F>,
) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors<F>>({});

  function change(name: F, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    const checked = validate(next);
    // Every field showing an error is re-checked, so picking "coach" also
    // clears a stale "Choose your grade.".
    setErrors((current) => {
      const updated: FieldErrors<F> = {};
      for (const key of Object.keys(current) as F[]) {
        if (current[key]) updated[key] = checked[key];
      }
      return updated;
    });
  }

  function blur(name: F) {
    const message = validate(values)[name];
    setErrors((current) => ({ ...current, [name]: message }));
  }

  /**
   * Checks every field and shows the results. Returns the first invalid
   * field, for the caller to focus, or undefined when the form is valid.
   */
  function checkAll(): F | undefined {
    const checked = validate(values);
    setErrors(checked);
    return firstInvalid(checked);
  }

  /** Replaces the shown errors with the server's. */
  function showErrors(next: FieldErrors<F>) {
    setErrors(next);
  }

  return { values, errors, change, blur, checkAll, showErrors };
}

/** Focuses a form's field by name (a radio group's first radio). */
export function focusField(form: HTMLFormElement | null, name: string) {
  form?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
}

/** aria-describedby for a field: its error when shown, else its hint. */
export function describedBy(id: string, error: string | undefined, hasHint: boolean) {
  return error ? `${id}-error` : hasHint ? `${id}-hint` : undefined;
}
