"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearDemoCookie } from "@/lib/auth/demo";
import { isAuthGateEnabled, safeNext } from "@/lib/auth/gate";
import { getCurrentUser } from "@/lib/auth/session";
import type { AuthFormState } from "@/lib/auth/types";
import { validateConfirm, validateEmail, validatePassword } from "@/lib/auth/validation";
import { friendlyError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

// redirect() throws, so every action awaits Supabase inside try/catch, keeps
// the outcome, and only redirects after the block.

// The origin this request came in on, for links in auth emails. Derived from
// the request (never a hardcoded domain) so localhost, previews and
// production each get links back to themselves.
async function requestOrigin(): Promise<string> {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (origin) return origin;
  const proto = firstForwarded(headerList.get("x-forwarded-proto")) ?? "http";
  const host = firstForwarded(headerList.get("x-forwarded-host")) ?? headerList.get("host");
  return `${proto}://${host}`;
}

// Proxy chains append their own value ("https,http"); the first is the client's.
function firstForwarded(value: string | null): string | null {
  return value?.split(",")[0].trim() || null;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// Gate disabled or no client: there is nothing to sign into, so send the
// visitor to the local demo.
async function requireClient() {
  if (!isAuthGateEnabled()) redirect("/beta");
  const supabase = await createClient();
  if (!supabase) redirect("/beta");
  return supabase;
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await requireClient();
  const email = field(formData, "email").trim();
  const password = field(formData, "password");

  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password, { requireLength: false }),
  };
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors, email };

  let error: unknown = null;
  try {
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  } catch (thrown) {
    error = thrown;
  }
  if (error) return { error: friendlyError(error), email };

  clearDemoCookie(await cookies());
  redirect(safeNext(formData.get("next")));
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await requireClient();
  const email = field(formData, "email").trim();
  const password = field(formData, "password");
  const confirm = field(formData, "confirm");

  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password, { requireLength: true }),
    confirm: validateConfirm(password, confirm),
  };
  if (fieldErrors.email || fieldErrors.password || fieldErrors.confirm) {
    return { fieldErrors, email };
  }

  const origin = await requestOrigin();
  let error: unknown = null;
  let hasSession = false;
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
    });
    error = result.error;
    hasSession = result.data.session !== null;
  } catch (thrown) {
    error = thrown;
  }
  if (error) return { error: friendlyError(error), email };
  // Email confirmation is on: the account exists but has no session until
  // the link in the email is opened.
  if (!hasSession) return { notice: "check-inbox", email };

  clearDemoCookie(await cookies());
  redirect("/onboarding");
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await requireClient();
  const email = field(formData, "email").trim();

  const emailError = validateEmail(email);
  if (emailError) return { fieldErrors: { email: emailError }, email };

  const origin = await requestOrigin();
  let error: unknown = null;
  try {
    ({ error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    }));
  } catch (thrown) {
    error = thrown;
  }
  // The same notice whatever happened, so the form never reveals whether an
  // account exists. Log only the code and status, never the email.
  if (error) {
    const { code, status } = error as { code?: unknown; status?: unknown };
    console.error("requestPasswordReset failed", { code, status });
  }
  return { notice: "reset-sent" };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const supabase = await requireClient();
  const password = field(formData, "password");
  const confirm = field(formData, "confirm");

  const fieldErrors = {
    password: validatePassword(password, { requireLength: true }),
    confirm: validateConfirm(password, confirm),
  };
  if (fieldErrors.password || fieldErrors.confirm) return { fieldErrors };

  if (!(await getCurrentUser())) redirect("/forgot-password");

  let error: unknown = null;
  try {
    ({ error } = await supabase.auth.updateUser({ password }));
  } catch (thrown) {
    error = thrown;
  }
  if (error) return { error: friendlyError(error) };

  // A reset after a compromise must end the attacker's sessions. "others"
  // keeps this session and its cookies; a failure here doesn't undo the reset.
  try {
    await supabase.auth.signOut({ scope: "others" });
  } catch {
    // Ignored: the password is already changed.
  }

  redirect("/beta");
}
