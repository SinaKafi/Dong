"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { buildShareText } from "@/lib/share";
import type { CurrencyCode, SettlementResult } from "@/lib/types";

interface ShareResultButtonProps {
  result: SettlementResult;
  currency: CurrencyCode;
  disabled?: boolean;
}

const RESET_MS = 2500;

export function ShareResultButton({ result, currency, disabled = false }: ShareResultButtonProps) {
  const [status, setStatus] = useState<"idle" | "shared" | "copied">("idle");

  async function handleShare() {
    const text = buildShareText(result, currency);
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const canShare =
      nav != null &&
      typeof nav.share === "function" &&
      typeof nav.canShare === "function"
        ? nav.canShare({ text })
        : typeof nav?.share === "function";

    try {
      if (canShare && nav?.share) {
        await nav.share({ title: "دنگ حساب", text });
        setStatus("shared");
      } else {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
      }
    } catch {
      // user cancelled share, or clipboard failed -- stay idle silently
      return;
    }
    window.setTimeout(() => setStatus("idle"), RESET_MS);
  }

  const label =
    status === "copied"
      ? "در کلیپ‌بورد کپی شد."
      : status === "shared"
        ? "نتیجه ارسال شد."
        : "ارسال نتیجه";

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={disabled}
        className={[
          "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
          status === "idle"
            ? "bg-white/90 text-slate-900 hover:bg-white active:scale-[0.98]"
            : "bg-emerald-400/90 text-emerald-950 active:scale-[0.98]",
          disabled ? "cursor-not-allowed opacity-50" : "",
        ].join(" ")}
        aria-live="polite"
      >
        {status === "idle" ? (
          <Share2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Check className="h-4 w-4" aria-hidden="true" />
        )}
        {status === "idle" ? "ارسال نتیجه" : label}
      </button>
    </div>
  );
}
