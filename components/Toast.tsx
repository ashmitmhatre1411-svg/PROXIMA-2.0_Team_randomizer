"use client";

import { useEffect } from "react";

export interface ToastState {
  id: number;
  message: string;
  tone: "success" | "error";
}

interface Props {
  toast: ToastState | null;
  onDismiss: () => void;
}

export default function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3200);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const tone =
    toast.tone === "error"
      ? "border-rose-400/40 bg-rose-950/90 text-rose-100"
      : "border-white/15 bg-[#12183a]/95 text-slate-100";

  return (
    <div
      key={toast.id}
      role="status"
      aria-live="polite"
      className={`toast-in fixed bottom-6 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl ${tone}`}
    >
      {toast.message}
    </div>
  );
}
