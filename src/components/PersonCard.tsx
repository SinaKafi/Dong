"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ExpenseRow } from "./ExpenseRow";
import { formatMoney } from "@/lib/format";
import { paidBy } from "@/lib/settlement";
import type { CurrencyCode, Participant } from "@/lib/types";

interface PersonCardProps {
  participant: Participant;
  index: number;
  currency: CurrencyCode;
  totalParticipants: number;
  onNameChange: (id: string, name: string) => string | null;
  onRemove: (id: string) => string | null;
  onAddExpense: (id: string, title: string, amount: number) => string | null;
  onRemoveExpense: (participantId: string, expenseId: string) => void;
}

const expenseInputSchema = z.object({
  title: z.string().trim().min(1, "عنوان هزینه نمی‌تواند خالی باشد."),
  amount: z
    .number({ invalid_type_error: "مبلغ باید عدد باشد." })
    .finite("مبلغ باید عدد معتبر باشد.")
    .positive("مبلغ باید بزرگ‌تر از صفر باشد."),
});
type ExpenseInput = z.infer<typeof expenseInputSchema>;

export function PersonCard({
  participant,
  index,
  currency,
  totalParticipants,
  onNameChange,
  onRemove,
  onAddExpense,
  onRemoveExpense,
}: PersonCardProps) {
  const [name, setName] = useState(participant.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseInputSchema),
    defaultValues: { title: "", amount: 0 as unknown as number },
    mode: "onSubmit",
  });

  const paid = paidBy(participant);

  function commitName() {
    const error = onNameChange(participant.id, name);
    setNameError(error);
  }

  function onAddSubmit(values: ExpenseInput) {
    const rounded = Math.round(values.amount);
    const error = onAddExpense(participant.id, values.title, rounded);
    if (error) {
      setActionError(error);
    } else {
      setActionError(null);
      setJustAdded(true);
      reset({ title: "", amount: 0 as unknown as number });
      window.setTimeout(() => setJustAdded(false), 1500);
    }
  }

  function handleRemoveParticipant() {
    const error = onRemove(participant.id);
    if (error) setActionError(error);
  }

  return (
    <article
      className="glass-card flex flex-col gap-4 rounded-3xl border border-white/15 p-4 sm:p-5"
      aria-label={`اطلاعات ${participant.name || `شرکت‌کننده ${index + 1}`}`}
    >
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`name-${participant.id}`}>
            نام
          </label>
          <input
            id={`name-${participant.id}`}
            type="text"
            inputMode="text"
            autoComplete="off"
            value={name}
            placeholder={`نفر ${index + 1}`}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            onBlur={commitName}
            aria-invalid={nameError ? true : false}
            aria-describedby={nameError ? `name-err-${participant.id}` : undefined}
            className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          />
          {nameError ? (
            <p id={`name-err-${participant.id}`} className="mt-1 text-xs text-rose-300">
              {nameError}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleRemoveParticipant}
          disabled={totalParticipants <= 2}
          aria-label="حذف این نفر"
          title={totalParticipants <= 2 ? "حداقل دو نفر باید باقی بمانند" : "حذف این نفر"}
          className="shrink-0 self-start rounded-lg p-2 text-rose-300/80 transition-colors hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
        <span className="text-white/60">پرداختی کل</span>
        <span className="font-mono tabular-nums text-white">{formatMoney(paid, currency)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {participant.expenses.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center text-xs text-white/40">
            هنوز هزینه‌ای ثبت نشده است.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {participant.expenses.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                currency={currency}
                onRemove={() => onRemoveExpense(participant.id, e.id)}
              />
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onAddSubmit)}
        className="flex flex-col gap-2 border-t border-white/10 pt-3"
        noValidate
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <label className="sr-only" htmlFor={`exp-title-${participant.id}`}>
              عنوان هزینه
            </label>
            <input
              id={`exp-title-${participant.id}`}
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="عنوان هزینه"
              {...register("title")}
              aria-invalid={errors.title ? true : false}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
          <div className="sm:w-40">
            <label className="sr-only" htmlFor={`exp-amount-${participant.id}`}>
              مبلغ
            </label>
            <input
              id={`exp-amount-${participant.id}`}
              type="number"
              inputMode="numeric"
              autoComplete="off"
              placeholder="مبلغ"
              min={1}
              step={1}
              {...register("amount", { setValueAs: (v) => (v === "" || v == null ? Number.NaN : Number(v)) })}
              aria-invalid={errors.amount ? true : false}
              className="w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        </div>
        {(errors.title || errors.amount) ? (
          <p className="text-xs text-rose-300" role="alert">
            {errors.title?.message ?? errors.amount?.message}
          </p>
        ) : null}
        {actionError ? (
          <p className="text-xs text-rose-300" role="alert">
            {actionError}
          </p>
        ) : null}
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white transition-all hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {justAdded ? "افزوده شد" : "افزودن هزینه"}
        </button>
      </form>
    </article>
  );
}
