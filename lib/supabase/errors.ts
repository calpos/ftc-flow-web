/**
 * Maps anything a Supabase call can return or throw (PostgrestError, AuthError,
 * a raw fetch TypeError, a string, junk) to short copy that is safe to show.
 * Raw error text never reaches the UI: it can carry SQL, constraint names and
 * internal hints. Never throws.
 */

const NETWORK = "Can't reach FTC Flow. Check your connection and try again.";
const SESSION_EXPIRED = "Your session expired. Sign in again.";
const FALLBACK = "Something went wrong. Try again.";

const NETWORK_RE = /failed to fetch|fetch failed|networkerror|load failed|network request failed/i;

// Tokens our RPCs raise (`raise exception 'last_owner'`). Postgres reports
// them with code P0001, so they're checked before the Postgres codes below.
const RPC_TOKENS: Readonly<Record<string, string>> = {
  not_authenticated: "Sign in to continue.",
  invalid_team_name: "Enter a valid team name.",
  invalid_team_number: "Enter a valid FTC team number.",
  team_number_taken: "Another team already uses that team number.",
  invalid_join_code: "That join code isn't valid.",
  not_team_member: "You're not a member of that team.",
  not_team_admin: "Only team admins can do that.",
  not_team_owner: "Only team owners can do that.",
  invalid_role: "That role isn't valid.",
  last_owner: "Make someone else an owner first.",
  poll_closed: "This poll is closed.",
  invalid_poll_option: "That option isn't part of this poll.",
};

const AUTH_CODES: Readonly<Record<string, string>> = {
  invalid_credentials: "Wrong email or password.",
  email_not_confirmed: "Confirm your email, then sign in.",
  user_already_exists: "An account with that email already exists.",
  email_exists: "An account with that email already exists.",
  weak_password: "Choose a stronger password.",
  over_email_send_rate_limit: "Too many emails sent. Wait a few minutes and try again.",
  over_request_rate_limit: "Too many attempts. Wait a moment and try again.",
  same_password: "Choose a password different from your current one.",
  session_not_found: SESSION_EXPIRED,
  session_expired: SESSION_EXPIRED,
};

const POSTGRES_CODES: Readonly<Record<string, string>> = {
  "23505": "That already exists.",
  "42501": "You don't have permission to do that.",
};

// Runs of [A-Za-z0-9_], so `ERROR: last_owner` yields `last_owner` but
// `not_last_owner_x` stays one token and matches nothing.
const TOKEN_RE = /[A-Za-z0-9_]+/g;

// Own-property check so keys like "constructor" never hit Object.prototype.
function lookup(table: Readonly<Record<string, string>>, key: string): string | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

// A getter may throw, so every read is guarded and wrong types are dropped.
function read(source: object, key: string): unknown {
  try {
    return (source as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function readString(source: object, key: string): string | undefined {
  const value = read(source, key);
  return typeof value === "string" ? value : undefined;
}

function readNumber(source: object, key: string): number | undefined {
  const value = read(source, key);
  return typeof value === "number" ? value : undefined;
}

function matchToken(text: string): string | undefined {
  for (const token of text.match(TOKEN_RE) ?? []) {
    const copy = lookup(RPC_TOKENS, token);
    if (copy) return copy;
  }
  return undefined;
}

export function friendlyError(error: unknown): string {
  let message: string | undefined;
  let name: string | undefined;
  let code: string | undefined;
  let status: number | undefined;
  let details: string | undefined;
  let hint: string | undefined;

  if (typeof error === "string") {
    message = error;
  } else if (typeof error === "object" && error !== null) {
    message = readString(error, "message");
    name = readString(error, "name");
    code = readString(error, "code");
    status = readNumber(error, "status");
    details = readString(error, "details");
    hint = readString(error, "hint");
  }

  // auth-js raises AuthRetryableFetchError with status 0 when the request
  // never got a response, and with the HTTP status for a 5xx. Without a
  // status, only the message check below can call it a network failure.
  if (name === "AuthRetryableFetchError") {
    if (status === 0) return NETWORK;
    if (status !== undefined && status >= 500 && status <= 599) return FALLBACK;
  }

  if (message && NETWORK_RE.test(message)) return NETWORK;

  // auth-js turns the API's session_not_found into this error, without a code.
  if (name === "AuthSessionMissingError") return SESSION_EXPIRED;

  // details and hint only for P0001: postgrest-js puts fetch failure stack
  // traces in details, where a function name could false-match a token.
  const texts = code === "P0001" ? [message, details, hint] : [message];
  for (const text of texts) {
    const copy = text && matchToken(text);
    if (copy) return copy;
  }

  if (code) {
    const copy = lookup(AUTH_CODES, code) ?? lookup(POSTGRES_CODES, code);
    if (copy) return copy;
  }

  return FALLBACK;
}
