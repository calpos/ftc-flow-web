import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// TODO: wire to real provider (Resend/Formspree/Supabase). Until then this
// stub validates the payload and returns 200 so the form flow is testable.
export async function POST(request: Request) {
  let email: unknown;
  try {
    const body = (await request.json()) as { email?: unknown };
    email = body.email;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
