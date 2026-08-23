"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import { useState } from "react";
import { ExpenseParticipants, inclusionSummary } from "./ExpenseParticipants";
import { formatMoney } from "@/lib/format";
import type { CurrencyCode, Expense, Participant } from "@/lib/types";

interface ExpenseRowProps {
  expense: Expense;
  currency: CurrencyCode;
  participants: Pick<Participant, "id" | "name">[];
  onRemove: () => void;
  onSetIncluded: (includedIds: string[]) => string | null;
}

export function ExpenseRow({ expense, currency, participants, onRemove, onSetIncluded }: ExpenseRowProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const included = expense.includedParticipantIds.filter((id) =>
    participants.some((p) => p.id === id),
  );

  function toggle(id: string) {
    const next = included.includes(id) ? included.filter((x) => x !== id) : [...included, id];
    const err = onSetIncluded(next);
    setError(err);
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
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
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={[
          "flex w-fit items-center gap-1.5 rounded-md text-xs text-white/60 transition-colors",
          "hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        ].join(" ")}
      >
        <ChevronDown
          className={["h-3.5 w-3.5 transition-transform", open ? "rotate-180" : ""].join(" ")}
          aria-hidden="true"
        />
        تقسیم {inclusionSummary(participants, included)}
      </button>

      {open ? (
        <ExpenseParticipants
          participants={participants}
          includedIds={included}
          onToggle={toggle}
          onSelectAll={() => {
            const err = onSetIncluded(participants.map((p) => p.id));
            setError(err);
          }}
          onClearAll={() => {
            const err = onSetIncluded([]);
            setError(err);
          }}
        />
      ) : null}

      {error ? (
        <p className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}