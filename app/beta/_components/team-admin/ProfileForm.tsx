"use client";

import { FormEvent, useRef, useState } from "react";
import type { FieldErrors, ProfileField, Role } from "@/app/onboarding/_lib/types";
import { GRADES, firstInvalid, isGrade, validateProfile } from "@/app/onboarding/_lib/validation";
import type { TeamMember } from "@/lib/beta/types";
import { Field, inputBase } from "../fields";
import { Button, Card } from "../ui";

// Same labels as onboarding's ProfileStep.
const ROLE_OPTIONS: readonly { value: Role; label: string }[] = [
  { value: "student", label: "I'm a student" },
  { value: "coach", label: "I'm a coach or mentor" },
];

const invalidBorder = "aria-[invalid=true]:border-danger";

const FIELD_IDS: Record<Exclude<ProfileField, "role">, string> = {
  firstName: "profile-first-name",
  lastName: "profile-last-name",
  grade: "profile-grade",
};

/**
 * The viewer's own profile. The caller keys it on the saved fields, so it
 * remounts with fresh state after a save or a rollback.
 */
export function ProfileForm({
  member,
  email,
  onSave,
}: {
  member: TeamMember;
  email: string;
  onSave: (m: TeamMember) => void;
}) {
  const initialRole: Role = member.isCoach ? "coach" : "student";
  const initialGrade = isGrade(member.grade) ? member.grade : "";
  const [firstName, setFirstName] = useState(member.firstName);
  const [lastName, setLastName] = useState(member.lastName);
  const [role, setRole] = useState<Role>(initialRole);
  const [grade, setGrade] = useState<string>(initialGrade);
  const [errors, setErrors] = useState<FieldErrors<ProfileField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // Trimmed, as saved: a whitespace-only edit would save nothing yet toast.
  const dirty =
    firstName.trim() !== member.firstName ||
    lastName.trim() !== member.lastName ||
    role !== initialRole ||
    (role === "student" && grade !== initialGrade);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty) return;
    // A blank name must never be sent: the layout would bounce to /onboarding.
    const next = validateProfile({ firstName, lastName, role, grade });
    setErrors(next);
    const invalid = firstInvalid(next);
    if (invalid) {
      focusField(formRef.current, invalid);
      return;
    }
    onSave({
      ...member,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      isCoach: role === "coach",
      grade: role === "coach" ? undefined : grade,
    });
  }

  return (
    <Card className="p-5">
      <h2 className="text-sm font-medium">Profile</h2>
      <form ref={formRef} noValidate onSubmit={submit} className="mt-4 space-y-4">
        <Field label="Email" htmlFor="profile-email">
          <input
            id="profile-email"
            type="email"
            value={email}
            readOnly
            className={`${inputBase} text-fg-mid`}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="profile-first-name">
            <input
              id="profile-first-name"
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-invalid={errors.firstName ? true : undefined}
              aria-describedby={errors.firstName ? "profile-first-name-error" : undefined}
              className={`${inputBase} ${invalidBorder}`}
            />
            <FieldError id="profile-first-name-error" error={errors.firstName} />
          </Field>
          <Field label="Last name" htmlFor="profile-last-name">
            <input
              id="profile-last-name"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              aria-invalid={errors.lastName ? true : undefined}
              aria-describedby={errors.lastName ? "profile-last-name-error" : undefined}
              className={`${inputBase} ${invalidBorder}`}
            />
            <FieldError id="profile-last-name-error" error={errors.lastName} />
          </Field>
        </div>

        <fieldset aria-describedby={errors.role ? "profile-role-error" : undefined}>
          <legend className="mb-2 block text-sm font-medium text-fg-mid">Your role</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-edge bg-raised px-3.5 py-3 text-sm transition-colors hover:border-signal-dim has-checked:border-signal"
              >
                <input
                  type="radio"
                  name="profile-role"
                  value={option.value}
                  checked={role === option.value}
                  onChange={() => setRole(option.value)}
                  className="h-4 w-4 shrink-0 accent-signal"
                />
                <span className="text-fg">{option.label}</span>
              </label>
            ))}
          </div>
          <FieldError id="profile-role-error" error={errors.role} />
        </fieldset>

        {role === "student" ? (
          <Field label="Grade" htmlFor="profile-grade">
            <select
              id="profile-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              aria-invalid={errors.grade ? true : undefined}
              aria-describedby={errors.grade ? "profile-grade-error" : undefined}
              className={`${inputBase} ${invalidBorder} [color-scheme:dark]`}
            >
              <option value="" disabled>
                Choose your grade
              </option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g === "Other" ? "Other" : `${g} grade`}
                </option>
              ))}
            </select>
            <FieldError id="profile-grade-error" error={errors.grade} />
          </Field>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={!dirty}>
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  );
}

// The role group has no id of its own, so it maps to its checked radio, else the first.
function focusField(form: HTMLFormElement | null, field: ProfileField) {
  if (!form) return;
  const target =
    field === "role"
      ? (form.querySelector<HTMLElement>('input[name="profile-role"]:checked') ??
        form.querySelector<HTMLElement>('input[name="profile-role"]'))
      : form.querySelector<HTMLElement>(`#${FIELD_IDS[field]}`);
  target?.focus();
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-xs text-danger">
      {error}
    </p>
  );
}
