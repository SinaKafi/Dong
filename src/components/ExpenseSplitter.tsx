"use client";

import { RotateCcw, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { CurrencySelector } from "./CurrencySelector";
import { PersonCard } from "./PersonCard";
import { ShareResultButton } from "./ShareResultButton";
import { SummaryCard } from "./SummaryCard";
import { useExpenseSplitter } from "@/hooks/useExpenseSplitter";
import { settle } from "@/lib/settlement";

export function ExpenseSplitter() {
  const {
    state,
    setCurrency,
    addParticipant,
    updateName,
    removeParticipant,
    addExpense,
    setExpenseIncluded,
    removeExpense,
    reset,
  } = useExpenseSplitter();
  const [resetOpen, setResetOpen] = useState(false);
  // Bumped on reset so PersonCard inputs remount with empty values.
  const [resetCount, setResetCount] = useState(0);

  const result = useMemo(() => settle(state.participants), [state.participants]);

  const canShare = result.participantCount >= 2 && state.participants.every((p) => p.name.trim() !== "");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">دنگ حساب</h1>
          <p className="mt-1 text-sm text-white/60">
            هزینه‌های گروهی را وارد کنید؛ دنگ هر نفر و تسویه‌حساب خودکار محاسبه می‌شود.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            حساب جدید
          </button>
        </div>
      </header>

      <div className="glass-card rounded-3xl border border-white/15 p-4 sm:p-5">
        <CurrencySelector value={state.currency} onChange={setCurrency} />
      </div>

      <section aria-label="افراد و هزینه‌ها" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {state.participants.map((p, i) => (
          <PersonCard
            key={`${resetCount}-${p.id}`}
            participant={p}
            index={i}
            currency={state.currency}
            allParticipants={state.participants.map((x) => ({ id: x.id, name: x.name }))}
            totalParticipants={state.participants.length}
            onNameChange={updateName}
            onRemove={removeParticipant}
            onAddExpense={addExpense}
            onSetExpenseIncluded={setExpenseIncluded}
            onRemoveExpense={removeExpense}
          />
        ))}
        <button
          type="button"
          onClick={addParticipant}
          className="flex min-h-16 items-center justify-center gap-2 rounded-3xl border border-dashed border-white/20 bg-white/3 px-4 py-4 text-sm font-semibold text-white/70 transition-all hover:border-white/40 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          افزودن نفر جدید
        </button>
      </section>

      <SummaryCard result={result} currency={state.currency}>
        <ShareResultButton result={result} currency={state.currency} disabled={!canShare} />
        {!canShare ? (
          <p className="text-center text-xs text-white/50">
            برای ارسال نتیجه، نام همه افراد را وارد کنید.
          </p>
        ) : null}
      </SummaryCard>

      <ConfirmationDialog
        open={resetOpen}
        title="شروع حساب جدید"
        description="همه شرکت‌کننده‌ها و هزینه‌ها پاک می‌شوند. این کار قابل بازگشت نیست. مطمئن هستید؟"
        confirmLabel="بله، همه را پاک کن"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          reset();
          setResetCount((c) => c + 1);
          setResetOpen(false);
        }}
      />
    </div>
  );
}
