"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";
import { formatJoinCode } from "@/app/onboarding/_lib/validation";
import { regenerateJoinCode } from "@/lib/beta/remote/api";
import { useToastStore } from "@/lib/beta/store/toastStore";
import { Button, Card } from "../ui";
import { canRegenerateJoinCode } from "./permissions";
import { useConfirmAction } from "./useConfirmAction";
import { useViewerAccess } from "./useViewerAccess";

/** The team's join code, for every member; managers can also regenerate it. */
export function JoinCodeCard() {
  const access = useViewerAccess();
  const router = useRouter();
  const confirm = useConfirmAction();
  const [copied, setCopied] = useState(false);
  const [freshCode, setFreshCode] = useState<{ code: string; superseded: string[] } | null>(
    null,
  );
  const copiedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  if (!access.remote) return null;
  const { team, teamId } = access;

  // The server context holds an old code until router.refresh() lands. Every
  // superseded code is kept: after two quick regenerates, the first refresh
  // can bring back the second code once the third is already issued.
  const code =
    freshCode && freshCode.superseded.includes(team.join_code) ? freshCode.code : team.join_code;
  const formatted = formatJoinCode(code);

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatted);
    } catch {
      useToastStore.getState().push("Couldn't copy. Select the code instead.");
      return;
    }
    setCopied(true);
    window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  function regenerate() {
    confirm.ask({
      title: "Regenerate join code?",
      body: code ? (
        <>
          The current code <span className="font-mono text-fg">{formatted}</span> stops working
          right away. Anyone who hasn&apos;t joined yet will need the new code.
        </>
      ) : (
        "Anyone who hasn't joined yet will need the new code."
      ),
      confirmLabel: "Regenerate",
      pendingLabel: "Regenerating…",
      tone: "primary",
      run: async () => {
        const next = await regenerateJoinCode(teamId);
        // The closure's team.join_code can be stale by now, so the displayed
        // code (prev.code) is superseded too.
        setFreshCode((prev) => ({
          code: next,
          superseded: [
            ...(prev?.superseded ?? []),
            ...(prev ? [prev.code] : []),
            team.join_code,
          ],
        }));
        router.refresh();
      },
      successToast: "New join code ready",
    });
  }

  return (
    <>
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-fg-dim">Join code</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {code ? (
            <span className="select-all font-mono text-2xl font-medium tracking-[0.14em] text-fg">
              {formatted}
            </span>
          ) : (
            <span className="text-sm text-fg-mid">Join code unavailable</span>
          )}
          <div className="flex flex-wrap gap-2">
            {code ? (
              <Button variant="secondary" onClick={copy} className="h-9 px-3">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-signal" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy
                  </>
                )}
              </Button>
            ) : null}
            {canRegenerateJoinCode(access.viewerRole) ? (
              <Button variant="ghost" onClick={regenerate} className="h-9 px-3">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-fg-dim">Teammates join at /onboarding with this code</p>
      </Card>
      {confirm.dialog}
    </>
  );
}
