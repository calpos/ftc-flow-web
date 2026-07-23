"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export interface DetailParam {
  value: string | null;
  open: (id: string) => void;
  close: () => void;
}

export function useDetailParam(key: string): DetailParam {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const value = searchParams.get(key);

  const open = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, id);
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname, key],
  );

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, router, pathname, key]);

  return { value, open, close };
}
