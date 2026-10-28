"use client";

import Link from "next/link";
import { useActionState, useState, type MouseEvent } from "react";
import { signIn, signUp } from "@/app/(auth)/actions";
import { DEFAULT_NEXT } from "@/lib/auth/gate";
import type { AuthFormState } from "@/lib/auth/types";
import {
  MIN_PASSWORD_LENGTH,
  validateConfirm,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";
import {
  AuthField,
  FormAlert,
  ResultHeadline,
  authCard,
  authHeadline,
  useAuthFields,
  type FieldErrors,
  type FieldValues,
} from "./fields";

type Mode = "signin" | "signup";

const EMPTY: AuthFormState = {};

function validateSignIn(values: FieldValues): FieldErrors {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password, { requireLength: false }),
  };
}

function validateSignUp(values: FieldValues): FieldErrors {
  return {
    email: validateEmail(values.email),
    password: validatePassword(values.password, { requireLength: true }),
    confirm: validateConfirm(values.password, values.confirm),
  };
}

const modeButton =
  "flex h-10 items-center justify-center rounded-[6px] text-sm font-medium transition-colors duration-150";

// Real links, so the toggles still switch modes without JavaScript.
function modeHref(target: Mode, next: string): string {
  const href = `/login?mode=${target}`;
  return next === DEFAULT_NEXT ? href : `${href}&next=${encodeURIComponent(next)}`;
}

export function LoginForm({
  next,
  initialMode,
  linkError,
}: {
  next: string;
  initialMode: Mode;
  linkError: boolean;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signInState, signInAction, signInPending] = useActionState(signIn, EMPTY);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, EMPTY);
  // useActionState can't be reset, so switching modes hides the results that
  // were showing; the next submit returns a new state object, which shows.
  const [dismissed, setDismissed] = useState<AuthFormState[]>([]);
  const [showLinkError, setShowLinkError] = useState(linkError);

  const signingIn = mode === "signin";
  const rawState = signingIn ? signInState : signUpState;
  const state = dismissed.includes(rawState) ? EMPTY : rawState;
  const isPending = signingIn ? signInPending : signUpPending;
  // Either action: switching mid-submit would swap the form's action.
  const anyPending = signInPending || signUpPending;
  const fields = useAuthFields(signingIn ? validateSignIn : validateSignUp, state.fieldErrors);

  function switchMode(target: Mode) {
    if (target === mode) return;
    setMode(target);
    setDismissed([signInState, signUpState]);
    setShowLinkError(false);
    fields.clear(["confirm"]);
  }

  function onModeClick(event: MouseEvent<HTMLAnchorElement>, target: Mode) {
    event.preventDefault();
    if (!anyPending) switchMode(target);
  }

  return (
    <>
      <div className={authCard}>
        {state.notice === "check-inbox" ? (
          <div role="status">
            <ResultHeadline>Check your inbox</ResultHeadline>
            <p className="mt-3 leading-relaxed text-fg-mid">
              We sent a confirmation link to{" "}
              <span className="font-medium text-fg">{state.email}</span>. Open it
              in this browser to finish creating your account.
            </p>
            <Link
              href={modeHref("signin", next)}
              onClick={(event) => onModeClick(event, "signin")}
              className={`${buttonSecondary} mt-7 w-full`}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className={authHeadline}>
              {signingIn ? "Sign in to FTC Flow" : "Create your FTC Flow account"}
            </h1>

            <div className="mt-6 grid grid-cols-2 gap-1 rounded-[10px] border border-edge bg-ink/40 p-1">
              <Link
                href={modeHref("signin", next)}
                aria-current={signingIn ? "page" : undefined}
                aria-disabled={anyPending || undefined}
                onClick={(event) => onModeClick(event, "signin")}
                className={`${modeButton} ${
                  signingIn ? "bg-raised text-fg" : "text-fg-mid hover:text-fg"
                }`}
              >
                Sign in
              </Link>
              <Link
                href={modeHref("signup", next)}
                aria-current={!signingIn ? "page" : undefined}
                aria-disabled={anyPending || undefined}
                onClick={(event) => onModeClick(event, "signup")}
                className={`${modeButton} ${
                  !signingIn ? "bg-raised text-fg" : "text-fg-mid hover:text-fg"
                }`}
              >
                Create account
              </Link>
            </div>

            <form
              action={signingIn ? signInAction : signUpAction}
              noValidate
              onSubmit={(event) => {
                setShowLinkError(false);
                fields.checkSubmit(event);
              }}
              className="mt-7 space-y-5"
            >
              <input type="hidden" name="next" value={next} />

              {showLinkError ? (
                <FormAlert>
                  That link is invalid or has expired.{" "}
                  <Link
                    href="/forgot-password"
                    className="font-medium underline underline-offset-2"
                  >
                    Request a new one.
                  </Link>
                </FormAlert>
              ) : null}
              {state.error ? <FormAlert>{state.error}</FormAlert> : null}

              <AuthField
                id="login-email"
                name="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={fields.values.email}
                error={fields.errors.email}
                onChange={(value) => fields.change("email", value)}
                onBlur={() => fields.blur("email")}
              />
              <AuthField
                id="login-password"
                name="password"
                label="Password"
                type="password"
                autoComplete={signingIn ? "current-password" : "new-password"}
                value={fields.values.password}
                error={fields.errors.password}
                hint={signingIn ? undefined : `At least ${MIN_PASSWORD_LENGTH} characters.`}
                aside={
                  signingIn ? (
                    <Link
                      href="/forgot-password"
                      className="text-sm text-fg-mid underline-offset-2 hover:text-fg hover:underline"
                    >
                      Forgot password?
                    </Link>
                  ) : null
                }
                onChange={(value) => fields.change("password", value)}
                onBlur={() => fields.blur("password")}
              />
              {signingIn ? null : (
                <AuthField
                  id="login-confirm"
                  name="confirm"
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  value={fields.values.confirm}
                  error={fields.errors.confirm}
                  onChange={(value) => fields.change("confirm", value)}
                  onBlur={() => fields.blur("confirm")}
                />
              )}

              <button
                type="submit"
                disabled={isPending}
                className={`${buttonPrimary} mt-2 w-full`}
              >
                {signingIn
                  ? isPending
                    ? "Signing in…"
                    : "Sign in"
                  : isPending
                    ? "Creating account…"
                    : "Create account"}
              </button>
            </form>
          </>
        )}
      </div>

      {/* A plain <a>, not next/link: a Link prefetch would run the route
          handler and set the demo cookie without a click. */}
      <p className="mt-6 text-center text-sm">
        <a
          href="/auth/demo"
          className="text-fg-mid underline-offset-2 hover:text-fg hover:underline"
        >
          Explore the demo without an account
        </a>
      </p>
    </>
  );
}
