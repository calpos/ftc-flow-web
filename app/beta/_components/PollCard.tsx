"use client";

import { Check, Pencil, Trophy } from "lucide-react";
import {
  Poll,
  formatPollClosingLine,
  getPollOptionCounts,
  getPollOptionEffectiveColor,
  getPollTotalVoters,
  getPollWinners,
  getUserPollVotes,
  isPollEffectivelyOpen,
} from "@/lib/beta/types";
import { Card } from "./ui";

export function PollCard({
  poll,
  currentUserId,
  creatorName,
  canManage,
  onVote,
  onManage,
}: {
  poll: Poll;
  currentUserId: string;
  creatorName: string;
  canManage: boolean;
  onVote: (optionId: string) => void;
  onManage: () => void;
}) {
  const open = isPollEffectivelyOpen(poll);
  const counts = getPollOptionCounts(poll);
  const totalVoters = getPollTotalVoters(poll);
  const myVotes = getUserPollVotes(poll, currentUserId);
  const winners = open ? [] : getPollWinners(poll);
  const isTied = winners.length > 1;

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0" style={{ backgroundColor: poll.color }} />
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-medium text-fg">{poll.question}</h3>
              <p className="mt-0.5 text-xs text-fg-dim">
                {creatorName} · {poll.allowMultiple ? "Multiple choice" : "Single choice"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  open ? "bg-success/15 text-success" : "bg-raised text-fg-dim"
                }`}
              >
                {open ? "Open" : "Closed"}
              </span>
              {canManage ? (
                <button
                  type="button"
                  onClick={onManage}
                  aria-label="Manage poll"
                  className="grid h-7 w-7 place-items-center rounded-md text-fg-dim hover:bg-raised hover:text-fg"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          {!open && (
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-fg-mid">Final results</span>
              </span>
              <span className="text-xs tabular-nums text-fg-mid">
                {totalVoters} {totalVoters === 1 ? "voter" : "voters"}
              </span>
            </div>
          )}

          <div className="mt-3 space-y-2">
            {poll.options.map((opt, i) => {
              const count = counts[opt.id] ?? 0;
              const pct = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;
              const mine = myVotes.includes(opt.id);
              const color = getPollOptionEffectiveColor(opt, i);

              if (!open) {
                const isWinner = winners.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`relative w-full overflow-hidden rounded-[10px] border-2 px-3 py-2.5 ${
                      isWinner ? "" : "opacity-60"
                    }`}
                    style={{ borderColor: isWinner ? poll.color : "var(--color-edge)" }}
                  >
                    <span
                      className="absolute inset-y-0 left-0 rounded-l-[9px] transition-[width] duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isWinner ? `${color}44` : `${color}11`,
                      }}
                      aria-hidden
                    />
                    <span className="relative flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        {isWinner ? (
                          <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-amber-500/20 text-amber-400">
                            <Trophy className="h-2.5 w-2.5" />
                          </span>
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-fg-dim/30" />
                        )}
                        <span
                          className={`truncate text-sm ${isWinner ? "font-medium text-fg" : "text-fg-dim"}`}
                        >
                          {opt.text}
                        </span>
                        {isWinner && isTied && (
                          <span className="shrink-0 rounded px-1 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400">
                            Tied
                          </span>
                        )}
                      </span>
                      <span
                        className={`shrink-0 text-xs tabular-nums ${isWinner ? "text-fg-mid" : "text-fg-dim"}`}
                      >
                        {count} · {pct}%
                      </span>
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={!open}
                  onClick={() => onVote(opt.id)}
                  className={`relative w-full overflow-hidden rounded-[10px] border px-3 py-2.5 text-left transition-colors ${
                    mine ? "border-signal" : "border-edge"
                  } ${open ? "hover:border-signal-dim" : "cursor-default"}`}
                >
                  <span
                    className="absolute inset-y-0 left-0 rounded-l-[9px] transition-[width] duration-300"
                    style={{ width: `${pct}%`, backgroundColor: `${color}22` }}
                    aria-hidden
                  />
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                          mine ? "border-signal bg-signal text-ink" : "border-fg-dim"
                        }`}
                      >
                        {mine ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="truncate text-sm text-fg">{opt.text}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-fg-mid">
                      {count} · {pct}%
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {!open && totalVoters === 0 && (
            <p className="mt-2 text-center text-xs italic text-fg-dim">No votes were cast.</p>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-fg-dim">
            <span>
              {open ? `${totalVoters} ${totalVoters === 1 ? "voter" : "voters"}` : null}
            </span>
            <span>{formatPollClosingLine(poll)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
