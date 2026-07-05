"use client";

import { ReactNode, useEffect } from "react";
import { useAppStore } from "@/lib/beta/store/appStore";
import { loadAppData } from "@/lib/beta/storage";

/**
 * Hydrates the Zustand store from localStorage once on mount (mirrors the
 * app's AppProvider). Until hydration completes, renders a minimal loading
 * state so server and first-client render match — avoiding hydration
 * mismatches from reading localStorage during render.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const hydrate = useAppStore((s) => s.hydrate);

  useEffect(() => {
    if (hasHydrated) return;
    let active = true;
    loadAppData().then((data) => {
      if (active) hydrate(data);
    });
    return () => {
      active = false;
    };
  }, [hasHydrated, hydrate]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-fg-dim">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-edge border-t-signal" />
          <span className="text-sm">Loading your team…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
