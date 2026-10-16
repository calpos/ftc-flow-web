"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";
import type { AuthFormState } from "@/lib/auth/types";
import { validateEmail } from "@/lib/auth/validation";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";
import {
  AuthField,
  ResultHeadline,
  authCard,
  authHeadline,
  useAuthFields,
  type FieldErrors,
  type FieldValues,
} from "./fields";

const EMPTY: AuthFormState = {};

function validate(values: FieldValues): FieldErrors {
  return { email: validateEmail(values.email) };
}

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, EMPTY);
  const fields = useAuthFields(validate, state.fieldErrors);

  return (
    <div className={authCard}>
      {state.notice === "reset-sent" ? (
        <div role="status">
          <ResultHeadline>Check your inbox</ResultHeadline>
          <p className="mt-3 leading-relaxed text-fg-mid">
            {"If an account exists for that email, we've sent a link to reset your password. Open it in this browser."}
          </p>
          <Link href="/login" className={`${buttonSecondary} mt-7 w-full`}>
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className={authHeadline}>Reset your password</h1>
          <p className="mt-3 leading-relaxed text-fg-mid">
            {"Enter your account email and we'll send you a reset link."}
          </p>

          <form
            action={formAction}
            noValidate
            onSubmit={fields.checkSubmit}
            className="mt-7 space-y-5"
          >
            <AuthField
              id="forgot-email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={fields.values.email}
              error={fields.errors.email}
              onChange={(value) => fields.change("email", value)}
              onBlur={() => fields.blur("email")}
            />
            <button
              type="submit"
              disabled={isPending}
              className={`${buttonPrimary} mt-2 w-full`}
            >
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm">
            <Link
              href="/login"
              className="text-fg-mid underline-offset-2 hover:text-fg hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
