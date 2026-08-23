"use client";

import { formatMoney } from "@/lib/format";
import type { CurrencyCode, Expense } from "@/lib/types";
import { Trash2 } from "lucide-react";

interface ExpenseRowProps {
  expense: Expense;
  currency: CurrencyCode;
  onRemove: () => void;
}

export function ExpenseRow({ expense, currency, onRemove }: ExpenseRowProps) {
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate text-white/85" title={expense.title}>
        {expense.title}
      </span>
      <span className="shrink-0 font-mono text-white/90 tabular-nums">
        {formatMoney(expense.amount, currency)}
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`حذف هزینه ${expense.title}`}
        className="shrink-0 rounded-md p-1 text-rose-300/80 transition-colors hover:bg-rose-500/15 hover:text-rose-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
