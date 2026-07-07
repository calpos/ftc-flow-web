"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const GOTO_MAP: Record<string, string> = {
  h: "/beta",
  t: "/beta/team",
  c: "/beta/calendar",
  a: "/beta/account",
};

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.getAttribute("contenteditable") !== null) return true;
  return false;
}

function isModalOpen(): boolean {
  return !!document.querySelector('[aria-modal="true"]');
}

export function useGotoHotkeys(): void {
  const router = useRouter();

  useEffect(() => {
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function reset() {
      pending = false;
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isInputFocused() || isModalOpen()) {
        reset();
        return;
      }

      if (pending) {
        reset();
        const dest = GOTO_MAP[e.key];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        return;
      }

      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        pending = true;
        timer = setTimeout(reset, 1500);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (timer !== null) clearTimeout(timer);
    };
  }, [router]);
}
