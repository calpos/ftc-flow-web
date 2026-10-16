/** Who is in /beta. `local`: Supabase is not configured (local demo mode). */
export type BetaAuth = { kind: "local" } | { kind: "demo" } | { kind: "user"; email: string };

/** State returned by the auth server actions to their forms. */
export type AuthFormState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "confirm", string>>;
  notice?: "check-inbox" | "reset-sent";
  email?: string;
};
