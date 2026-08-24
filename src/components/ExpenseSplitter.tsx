"use client";

import { ArrowLeft, ArrowRight, RotateCcw, UserPlus } from "lucide-react";
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
  const [step, setStep] = useState<1 | 2>(1);

  const result = useMemo(
    () => settle(state.participants),
    [state.participants],
  );

  const canShare =
    result.participantCount >= 2 &&
    state.participants.every((p) => p.name.trim() !== "");

  // Step 1 → 2 gate: 2+ participants, all named, all unique.
  const canProceed =
    state.participants.length >= 2 &&
    state.participants.every((p) => p.name.trim() !== "") &&
    new Set(state.participants.map((p) => p.name.trim())).size ===
      state.participants.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            دنگ حساب
          </h1>
          <p className="mt-1 text-sm text-white/60">
            هزینه‌های گروهی را وارد کنید؛ دنگ هر نفر و تسویه‌حساب خودکار محاسبه
            می‌شود.
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

      {/* Stepper */}
      <nav
        aria-label="مراحل"
        className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-2 rounded-b-2xl bg-slate-950/1 px-4 py-3 text-sm backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 border-b border-white/2"
      >
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-colors ${
            step === 1
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/50 cursor-pointer"
          }`}
          onClick={() => setStep(1)}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
            ۱
          </span>
          افراد
        </span>
        <span className="text-white/30" aria-hidden="true">
          {">"}
        </span>
        <span
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition-colors ${
            step === 2
              ? "bg-white/15 text-white"
              : "bg-white/5 text-white/50 cursor-pointer"
          }`}
          onClick={() => setStep(2)}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
            ۲
          </span>
          هزینه‌ها و تسویه
        </span>
      </nav>

      {step === 1 ? (
        <>
          <div className="glass-card rounded-3xl border border-white/15 p-4 sm:p-5">
            <CurrencySelector value={state.currency} onChange={setCurrency} />
          </div>

          <section
            aria-label="افراد"
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {state.participants.map((p, i) => (
              <PersonCard
                key={`${resetCount}-${p.id}`}
                variant="manage"
                participant={p}
                index={i}
                currency={state.currency}
                allParticipants={state.participants.map((x) => ({
                  id: x.id,
                  name: x.name,
                }))}
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

          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceed}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              مرحله بعد
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {!canProceed ? (
              <p className="text-center text-xs text-white/50">
                نام همه افراد را وارد کنید و نام‌ها تکراری نباشند.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              بازگشت به افراد
            </button>
          </div>

          <section
            aria-label="هزینه‌ها"
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            {state.participants.map((p, i) => (
              <PersonCard
                key={`${resetCount}-${p.id}`}
                variant="expenses"
                participant={p}
                index={i}
                currency={state.currency}
                allParticipants={state.participants.map((x) => ({
                  id: x.id,
                  name: x.name,
                }))}
                totalParticipants={state.participants.length}
                onNameChange={updateName}
                onRemove={removeParticipant}
                onAddExpense={addExpense}
                onSetExpenseIncluded={setExpenseIncluded}
                onRemoveExpense={removeExpense}
              />
            ))}
          </section>

          <SummaryCard result={result} currency={state.currency}>
            <ShareResultButton
              result={result}
              currency={state.currency}
              disabled={!canShare}
            />
            {!canShare ? (
              <p className="text-center text-xs text-white/50">
                برای ارسال نتیجه، نام همه افراد را وارد کنید.
              </p>
            ) : null}
          </SummaryCard>
        </>
      )}

      <ConfirmationDialog
        open={resetOpen}
        title="شروع حساب جدید"
        description="همه شرکت‌کننده‌ها و هزینه‌ها پاک می‌شوند. این کار قابل بازگشت نیست. مطمئن هستید؟"
        confirmLabel="بله، همه را پاک کن"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          reset();
          setResetCount((c) => c + 1);
          setStep(1);
          setResetOpen(false);
        }}
      />
    </div>
  );
}
