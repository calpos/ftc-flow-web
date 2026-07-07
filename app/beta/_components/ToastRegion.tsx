"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useToastStore } from "@/lib/beta/store/toastStore";

function ToastItem({ id, message }: { id: string; message: string }) {
  const dismiss = useToastStore((s) => s.dismiss);

  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leavingRef = useRef(false);

  const leave = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = setTimeout(leave, 3500);
  }, [leave]);

  useEffect(() => {
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      setMounted(true);
      startTimer();
    });
    return () => {
      cancelAnimationFrame(rafId);
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(() => dismiss(id), 200);
    return () => clearTimeout(t);
  }, [leaving, id, dismiss]);

  return (
    <div
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
      className={
        "flex items-center gap-2.5 rounded-2xl border border-edge bg-surface px-4 py-3 shadow-2xl transition-[opacity,transform] duration-200 ease-out" +
        (mounted && !leaving
          ? " translate-y-0 opacity-100"
          : " translate-y-2 opacity-0")
      }
    >
      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      <span className="text-sm font-medium text-fg">{message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={leave}
        className="ml-1 grid h-5 w-5 shrink-0 place-items-center rounded text-fg-dim hover:text-fg"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastRegion() {
  const toasts = useToastStore((s) => s.toasts);
  const latest = toasts[toasts.length - 1];

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {latest ? <span key={latest.id}>{latest.message}</span> : null}
      </div>
      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[200] flex flex-col items-center gap-2">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem id={t.id} message={t.message} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
