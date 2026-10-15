/**
 * The demo cookie: lets a visitor into /beta without an account (data stays
 * in their browser). Pure, no next/headers import, so the proxy, layouts,
 * server actions and route handlers can all use it. The store types are
 * minimal so both NextRequest/NextResponse cookies and the cookies() store fit.
 */

export const DEMO_COOKIE = "ftcflow_demo";
export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

type CookieReader = { has(name: string): boolean };

type CookieWriter = {
  set(
    name: string,
    value: string,
    options?: {
      path?: string;
      sameSite?: "lax" | "strict" | "none";
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
    },
  ): unknown;
};

export function hasDemoCookie(store: CookieReader): boolean {
  return store.has(DEMO_COOKIE);
}

export function setDemoCookie(store: CookieWriter, secure: boolean): void {
  store.set(DEMO_COOKIE, "1", {
    path: "/",
    sameSite: "lax",
    maxAge: DEMO_COOKIE_MAX_AGE,
    httpOnly: true,
    secure,
  });
}

export function clearDemoCookie(store: CookieWriter): void {
  store.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
}
