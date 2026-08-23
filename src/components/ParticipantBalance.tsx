"use client";

import { CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactElement } from "react";
import { formatSignedMoney } from "@/lib/format";
import type { BalanceResult, CurrencyCode } from "@/lib/types";

interface ParticipantBalanceProps {
  balance: BalanceResult;
  currency: CurrencyCode;
}

const STATUS_STYLES: Record<BalanceResult["status"], { chip: string; icon: ReactElement; label: string }> = {
  creditor: {
    chip: "border-emerald-300/30 bg-emerald-400/15 text-emerald-200",
    label: "طلبکار",
    icon: <TrendingUp className="h-4 w-4" aria-hidden="true" />,
  },
  debtor: {
    chip: "border-rose-300/30 bg-rose-400/15 text-rose-200",
    label: "بدهکار",
    icon: <TrendingDown className="h-4 w-4" aria-hidden="true" />,
  },
  settled: {
    chip: "border-white/15 bg-white/10 text-white/70",
    label: "تسویه",
    icon: <CheckCircle2 className="h-4 w-4" aria-hidden="true" />,
  },
};

export function ParticipantBalance({ balance, currency }: ParticipantBalanceProps) {
  const s = STATUS_STYLES[balance.status];
  return (
    <li
      className={[
        "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
        s.chip,
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true">{s.icon}</span>
        <span className="truncate font-semibold">{balance.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs opacity-80">{s.label}</span>
        <span className="font-mono tabular-nums">
          {balance.balance === 0 ? formatSignedMoney(0, currency) : formatSignedMoney(balance.balance, currency)}
        </span>
      </div>
    </li>
  );
}
