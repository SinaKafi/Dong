"use client";

import { formatAmount, formatMoney } from "@/lib/format";
import type { CurrencyCode, SettlementResult } from "@/lib/types";
import { ParticipantBalance } from "./ParticipantBalance";
import { SettlementList } from "./SettlementList";

interface SummaryCardProps {
  result: SettlementResult;
  currency: CurrencyCode;
  children?: React.ReactNode;
}

export function SummaryCard({ result, currency, children }: SummaryCardProps) {
  const namedCount = result.participantCount;
  const shareText =
    result.remainder > 0
      ? `${formatMoney(result.sharePerPerson, currency)} تا ${formatMoney(result.sharePerPerson + 1, currency)}`
      : formatMoney(result.sharePerPerson, currency);

  return (
    <section
      aria-label="خلاصه حساب"
      className="glass-card flex flex-col gap-5 rounded-3xl border border-white/15 p-4 sm:p-6"
    >
      <h2 className="text-lg font-bold text-white">خلاصه حساب</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">کل هزینه‌ها</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
            {formatMoney(result.totalExpenses, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">تعداد افراد</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
            {formatAmount(namedCount)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/60">دنگ هر نفر</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{shareText}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white/80">وضعیت هر نفر</h3>
        {namedCount === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-center text-xs text-white/40">
            هنوز کسی اضافه نشده است.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.balances.map((b) => (
              <ParticipantBalance key={b.participantId} balance={b} currency={currency} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white/80">تسویه حساب</h3>
        <SettlementList result={result} currency={currency} />
      </div>

      {children}
    </section>
  );
}
