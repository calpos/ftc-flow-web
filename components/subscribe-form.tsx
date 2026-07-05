"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { buttonPrimary, monoLabel } from "@/lib/ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("Enter a valid email address, like you@team.org.");
      return;
    }
    setError(null);
    setStatus("submitting");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!response.ok) {
        throw new Error(`Subscribe failed with status ${response.status}`);
      }
      setStatus("success");
    } catch {
      setStatus("idle");
      setError("Something went wrong on our end. Try again in a moment.");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-[10px] border border-edge bg-raised px-5 py-6"
      >
        <p className="font-medium text-fg">{"You're on the list."}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-fg-mid">
          {"One email when the beta opens, one at launch. That's it."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label
        htmlFor="subscribe-email"
        className={`${monoLabel} block text-fg-dim`}
      >
        Email
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="subscribe-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          placeholder="you@team.org"
          aria-invalid={error !== null}
          aria-describedby={error ? "subscribe-email-error" : undefined}
          className="h-12 w-full rounded-[10px] border border-edge bg-raised px-4 text-fg placeholder:text-fg-dim"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className={`${buttonPrimary} shrink-0`}
        >
          {status === "submitting" ? "Joining…" : "Join the list"}
        </button>
      </div>
      <p
        id="subscribe-email-error"
        aria-live="polite"
        className="mt-2 min-h-5 text-sm text-danger"
      >
        {error}
      </p>
    </form>
  );
}
