"use client";

import { Check, Info, RotateCcw } from "lucide-react";
import { useApp } from "@/lib/beta/store/hooks";
import { resetBetaData } from "@/lib/beta/storage";
import { Avatar, Button, Card } from "../_components/ui";

export default function AccountPage() {
  const { members, currentUser, currentUserId, setUser } = useApp();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-fg-mid">
          There&apos;s no sign-in yet. Switch perspective to see how FTC Flow looks for any
          member of the team.
        </p>
      </header>

      {currentUser ? (
        <Card className="flex items-center gap-4 p-5">
          <Avatar member={currentUser} size={56} />
          <div className="min-w-0">
            <p className="text-lg font-medium text-fg">
              {currentUser.firstName} {currentUser.lastName}
            </p>
            <p className="text-sm text-fg-mid">
              {currentUser.isCoach
                ? "Coach"
                : `${currentUser.teamRole}${currentUser.grade ? ` · ${currentUser.grade}` : ""}`}
            </p>
            {currentUser.workRoles.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {currentUser.workRoles.map((r) => (
                  <span key={r} className="rounded-md bg-raised px-2 py-0.5 text-xs text-fg-mid">
                    {r}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium">Viewing as</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const active = m.id === currentUserId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setUser(m.id)}
                aria-pressed={active}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  active
                    ? "border-signal bg-signal-dim/40"
                    : "border-edge bg-surface hover:border-signal-dim"
                }`}
              >
                <Avatar member={m} size={38} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">
                    {m.firstName} {m.lastName}
                  </p>
                  <p className="truncate text-xs text-fg-dim">
                    {m.isCoach ? "Coach" : m.teamRole}
                  </p>
                </div>
                {active ? <Check className="h-4 w-4 shrink-0 text-signal" /> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-fg-dim">
          <Info className="h-3.5 w-3.5" />
          Edit team and work roles from the Team → Members tab.
        </p>
      </section>

      <Card className="space-y-3 p-5">
        <h2 className="text-sm font-medium">About this beta</h2>
        <p className="text-sm leading-relaxed text-fg-mid">
          This is the full FTC Flow app running locally in your browser. Everything you create
          is stored only on this device — no account, no server. Real accounts and cloud sync
          arrive with the production launch at beta.ftcflow.app.
        </p>
        <Button
          variant="secondary"
          onClick={async () => {
            await resetBetaData();
            window.location.reload();
          }}
        >
          <RotateCcw className="h-4 w-4" /> Reset demo data
        </Button>
      </Card>
    </div>
  );
}
