"use client";

import { ChevronDown } from "lucide-react";
import { useRef, useState, type FocusEvent, type FormEvent } from "react";
import { authCard } from "@/app/(auth)/_components/fields";
import { friendlyError } from "@/lib/supabase/errors";
import { buttonPrimary, monoLabel, textInput } from "@/lib/ui";
import { saveProfile } from "../actions";
import type { ProfileField, ProfileInput, Role, SaveProfileResult } from "../_lib/types";
import { GRADES, firstInvalid, isRole, validateProfile } from "../_lib/validation";
import { ActionAlert, FieldMessage, StepHeading, TextField } from "./parts";
import { describedBy, focusField, useFormFields } from "./useFormFields";

const ROLE_OPTIONS: readonly { value: Role; label: string }[] = [
  { value: "student", label: "I'm a student" },
  { value: "coach", label: "I'm a coach or mentor" },
];

const radioCard =
  "flex cursor-pointer items-center gap-3 rounded-[10px] border border-edge bg-raised px-4 py-3.5 transition-colors duration-150 hover:border-signal-dim has-checked:border-signal";

export function ProfileStep({
  initial,
  focusHeading,
  signInNext,
  onSaved,
}: {
  initial: ProfileInput;
  focusHeading: boolean;
  signInNext: string;
  /** Called once the profile is saved; this step stays busy until it unmounts. */
  onSaved: (role: Role) => void;
}) {
  const fields = useFormFields<ProfileField>(initial, validateProfile);
  const [pending, setPending] = useState(false);
  const [alert, setAlert] = useState<{ error: string; signedOut?: boolean } | null>(null);
  // State updates land a render late; the ref stops a second submit at once.
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { values, errors } = fields;
  const isStudent = values.role === "student";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const invalid = fields.checkAll();
    if (invalid) {
      focusField(formRef.current, invalid);
      return;
    }

    busy.current = true;
    setPending(true);
    setAlert(null);
    let result: SaveProfileResult;
    try {
      result = await saveProfile(values);
    } catch (error) {
      // The action itself never throws; this is the request failing.
      result = { ok: false, error: friendlyError(error) };
    }
    if (result.ok) {
      if (isRole(values.role)) onSaved(values.role);
      return;
    }

    busy.current = false;
    setPending(false);
    if (result.fieldErrors) {
      fields.showErrors(result.fieldErrors);
      const first = firstInvalid(result.fieldErrors);
      if (first) focusField(formRef.current, first);
    }
    if (result.error) setAlert({ error: result.error, signedOut: result.signedOut });
  }

  // Checked when focus leaves the group, not when it moves between radios.
  function blurRoleGroup(event: FocusEvent<HTMLFieldSetElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) fields.blur("role");
  }

  return (
    <div className={authCard}>
      <StepHeading focus={focusHeading}>Set up your profile</StepHeading>
      <p className="mt-3 leading-relaxed text-fg-mid">
        {"This is how you'll show up on your team's roster."}
      </p>

      <form ref={formRef} noValidate onSubmit={submit} className="mt-7 space-y-5">
        {alert ? (
          <ActionAlert error={alert.error} signedOut={alert.signedOut} signInNext={signInNext} />
        ) : null}

        <TextField
          id="onboarding-first-name"
          name="firstName"
          label="First name"
          autoComplete="given-name"
          value={values.firstName}
          error={errors.firstName}
          onChange={(value) => fields.change("firstName", value)}
          onBlur={() => fields.blur("firstName")}
        />
        <TextField
          id="onboarding-last-name"
          name="lastName"
          label="Last name"
          autoComplete="family-name"
          value={values.lastName}
          error={errors.lastName}
          onChange={(value) => fields.change("lastName", value)}
          onBlur={() => fields.blur("lastName")}
        />

        <fieldset
          role="radiogroup"
          aria-labelledby="onboarding-role-legend"
          aria-required="true"
          aria-invalid={errors.role ? true : undefined}
          aria-describedby={describedBy("onboarding-role", errors.role, false)}
          onBlur={blurRoleGroup}
        >
          <legend id="onboarding-role-legend" className={`${monoLabel} text-fg-dim`}>
            Your role
          </legend>
          <div className="mt-2 space-y-2">
            {ROLE_OPTIONS.map((option) => (
              <label key={option.value} className={radioCard}>
                <input
                  type="radio"
                  name="role"
                  value={option.value}
                  checked={values.role === option.value}
                  onChange={() => fields.change("role", option.value)}
                  className="h-4 w-4 shrink-0 accent-signal"
                />
                <span className="text-fg">{option.label}</span>
              </label>
            ))}
          </div>
          <FieldMessage id="onboarding-role" error={errors.role} />
        </fieldset>

        {isStudent ? (
          <div>
            <label htmlFor="onboarding-grade" className={`${monoLabel} block text-fg-dim`}>
              Grade
            </label>
            <div className="relative mt-2">
              <select
                id="onboarding-grade"
                name="grade"
                required
                value={values.grade}
                onChange={(event) => fields.change("grade", event.target.value)}
                onBlur={() => fields.blur("grade")}
                aria-invalid={errors.grade ? true : undefined}
                aria-describedby={describedBy("onboarding-grade", errors.grade, false)}
                className={`${textInput} appearance-none pr-11 [color-scheme:dark]`}
              >
                <option value="" disabled>
                  Choose your grade
                </option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade === "Other" ? "Other" : `${grade} grade`}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim"
              />
            </div>
            <FieldMessage id="onboarding-grade" error={errors.grade} />
          </div>
        ) : null}

        <button type="submit" disabled={pending} className={`${buttonPrimary} mt-2 w-full`}>
          {pending ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
