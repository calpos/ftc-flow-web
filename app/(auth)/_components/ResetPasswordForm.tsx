"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/auth/types";
import {
  MIN_PASSWORD_LENGTH,
  validateConfirm,
  validatePassword,
} from "@/lib/auth/validation";
import { buttonPrimary } from "@/lib/ui";
import {
  AuthField,
  FormAlert,
  authCard,
  authHeadline,
  useAuthFields,
  type FieldErrors,
  type FieldValues,
} from "./fields";

const EMPTY: AuthFormState = {};

function validate(values: FieldValues): FieldErrors {
  return {
    password: validatePassword(values.password, { requireLength: true }),
    confirm: validateConfirm(values.password, values.confirm),
  };
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, EMPTY);
  const fields = useAuthFields(validate, state.fieldErrors);

  return (
    <div className={authCard}>
      <h1 className={authHeadline}>Choose a new password</h1>

      <form
        action={formAction}
        noValidate
        onSubmit={fields.checkSubmit}
        className="mt-7 space-y-5"
      >
        {state.error ? <FormAlert>{state.error}</FormAlert> : null}
        <AuthField
          id="reset-password"
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={fields.values.password}
          error={fields.errors.password}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          onChange={(value) => fields.change("password", value)}
          onBlur={() => fields.blur("password")}
        />
        <AuthField
          id="reset-confirm"
          name="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={fields.values.confirm}
          error={fields.errors.confirm}
          onChange={(value) => fields.change("confirm", value)}
          onBlur={() => fields.blur("confirm")}
        />
        <button
          type="submit"
          disabled={isPending}
          className={`${buttonPrimary} mt-2 w-full`}
        >
          {isPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
