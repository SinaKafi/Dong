"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

interface ResetConfirmationDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetConfirmationDialog({ open, onCancel, onConfirm }: ResetConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="glass-card w-full max-w-sm rounded-3xl border border-white/15 p-5 shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 text-amber-300">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 id="reset-dialog-title" className="text-base font-bold text-white">
            شروع حساب جدید
          </h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/75">
          همه شرکت‌کننده‌ها و هزینه‌ها پاک می‌شوند. این کار قابل بازگشت نیست. مطمئن هستید؟
        </p>
        <div className="mt-5 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-500/90 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
          >
            بله، همه را پاک کن
          </button>
        </div>
      </div>
    </div>
  );
}
