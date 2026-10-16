"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ResultHeadline, authCard } from "@/app/(auth)/_components/fields";
import { friendlyError } from "@/lib/supabase/errors";
import { setActiveTeam } from "@/lib/teams/actions";
import { buttonPrimary, buttonSecondary, monoLabel } from "@/lib/ui";
import type { CreatedTeam } from "../_lib/types";
import { formatJoinCode } from "../_lib/validation";
import { ActionAlert, OpenAppAnyway, SIGNED_OUT_ERROR } from "./parts";

type CopyStatus = "idle" | "copied" | "failed";

const COPIED_RESET_MS = 2500;

export function TeamCreated({
  team,
  signInNext,
  onLeave,
}: {
  team: CreatedTeam;
  signInNext: string;
  /** Called just before the page leaves for /beta: the flow is over. */
  onLeave: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const code = team.joinCode ? formatJoinCode(team.joinCode) : null;

  useEffect(() => {
    const timers = resetTimer;
    return () => clearTimeout(timers.current);
  }, []);

  async function copy() {
    if (!code) return;
    clearTimeout(resetTimer.current);
    let copied = false;
    try {
      // Missing outside secure contexts and in some embedded browsers.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        copied = true;
      }
    } catch {
      copied = false;
    }
    setCopyStatus(copied ? "copied" : "failed");
    if (copied) resetTimer.current = setTimeout(() => setCopyStatus("idle"), COPIED_RESET_MS);
  }

  // Only activates the team; it was created already, so a retry never
  // creates another.
  async function openApp() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    let result: { ok: true } | { ok: false; error: string };
    try {
      result = await setActiveTeam(team.teamId);
    } catch (thrown) {
      result = { ok: false, error: friendlyError(thrown) };
    }
    if (result.ok) {
      // Done with this screen, so a reload of /onboarding mustn't bring it back.
      onLeave();
      // A full load, so /beta's server-resolved team context is rebuilt.
      window.location.assign("/beta");
      return;
    }
    busy.current = false;
    setPending(false);
    setError(result.error);
  }

  return (
    <div className={authCard}>
      <ResultHeadline>Your team is ready</ResultHeadline>
      <p className="mt-3 leading-relaxed text-fg-mid">
        <span className="font-medium text-fg">{team.name}</span>
        {" is set up, and you're its owner."}
      </p>

      {code ? (
        <>
          <p className={`${monoLabel} mt-7 text-fg-dim`}>Join code</p>
          <p className="mt-2 select-all rounded-[10px] border border-edge bg-raised px-4 py-4 text-center font-mono text-3xl font-medium tracking-[0.12em] text-fg">
            {code}
          </p>
          <button type="button" onClick={copy} className={`${buttonSecondary} mt-3 w-full gap-2`}>
            {copyStatus === "copied" ? (
              <Check aria-hidden className="h-4 w-4" />
            ) : (
              <Copy aria-hidden className="h-4 w-4" />
            )}
            Copy code
          </button>
          {/* Always rendered, so screen readers announce each change. */}
          <p aria-live="polite" className="mt-2 min-h-5 text-sm text-fg-mid">
            {copyStatus === "copied"
              ? "Copied"
              : copyStatus === "failed"
                ? "Couldn't copy. Select the code and copy it yourself."
                : ""}
          </p>
          <p className="mt-3 leading-relaxed text-fg-mid">
            {"Share this with your team. They'll enter it when they join FTC Flow."}
          </p>
        </>
      ) : (
        <p className="mt-7 leading-relaxed text-fg-mid">
          {"We couldn't load your join code just now. Your team is set up, so you can continue."}
        </p>
      )}

      {error ? (
        <div className="mt-7">
          <ActionAlert
            error={error}
            signedOut={error === SIGNED_OUT_ERROR}
            signInNext={signInNext}
          >
            <OpenAppAnyway />
          </ActionAlert>
        </div>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={openApp}
        className={`${buttonPrimary} mt-7 w-full`}
      >
        {pending ? "Opening FTC Flow…" : "Continue to FTC Flow"}
      </button>
    </div>
  );
}
