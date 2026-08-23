"use client";

import { CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { transferSentence } from "@/lib/share";
import type { CurrencyCode, SettlementResult } from "@/lib/types";

interface SettlementListProps {
  result: SettlementResult;
  currency: CurrencyCode;
}

export function SettlementList({ result, currency }: SettlementListProps) {
  if (result.transfers.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70">
        <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        حساب همه تسویه است و نیازی به انتقال پول نیست.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {result.transfers.map((t) => (
        <li
          key={`${t.fromId}-${t.toId}`}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
        >
          <span className="text-white/90">{transferSentence(t, currency)}</span>
          <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 font-mono text-xs tabular-nums text-white/80">
            {formatMoney(t.amount, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}