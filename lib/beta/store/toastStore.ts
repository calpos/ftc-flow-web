import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string) => void;
  dismiss: (id: string) => void;
}

let seq = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (message) =>
    set((s) => ({
      toasts: [...s.toasts, { id: "t" + ++seq, message }].slice(-3),
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
