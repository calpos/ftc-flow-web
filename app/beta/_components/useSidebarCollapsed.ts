'use client';
import { useEffect, useState } from 'react';
const KEY = 'ftc_flow_sidebar_collapsed';
export function useSidebarCollapsed(): [boolean, (v: boolean) => void] {
  const [collapsed, setCollapsedState] = useState(false);
  useEffect(() => {
    try {
      setCollapsedState(window.localStorage.getItem(KEY) === '1');
    } catch {
      // storage unavailable
    }
  }, []);
  function setCollapsed(v: boolean) {
    setCollapsedState(v);
    try {
      window.localStorage.setItem(KEY, v ? '1' : '0');
    } catch {
      // storage unavailable
    }
  }
  return [collapsed, setCollapsed];
}
