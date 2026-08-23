"use client";

import { toPersianDigits } from "@/lib/format";
import { Check } from "lucide-react";

interface ExpenseParticipantsProps {
  /** All group participants (id + name). */
  participants: { id: string; name: string }[];
  includedIds: string[];
  onToggle: (participantId: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  /** Compact summary line mode vs full chip selector. */
  compact?: boolean;
}

/** Compact summary: "بین همه افراد" / "بین سینا و حسام" / "بین ۳ نفر". */
export function inclusionSummary(
  participants: { id: string; name: string }[],
  includedIds: string[],
): string {
  if (includedIds.length === participants.length) return "بین همه افراد";
  const names = participants
    .filter((p) => includedIds.includes(p.id))
    .map((p) => p.name)
    .filter(Boolean);
  if (names.length === 0) return "انتخاب نشده";
  if (names.length <= 2) {
    return `بین ${names.length === 1 ? names[0] : `${names[0]} و ${names[1]}`}`;
  }
  return `بین ${toPersianDigits(names.length)} نفر`;
}

/**
 * Chip selector for "این هزینه بین چه کسانی تقسیم شود؟" -- selected participants
 * have an active state, excluded ones are visually muted. Fully RTL and
 * touch-friendly.
 */
export function ExpenseParticipants({
  participants,
  includedIds,
  onToggle,
  onSelectAll,
  onClearAll,
  compact = false,
}: ExpenseParticipantsProps) {
  const allSelected = includedIds.length === participants.length;
  const noneSelected = includedIds.length === 0;

  if (compact) {
    return (
      <p className="text-xs text-white/60" aria-live="polite">
        تقسیم {inclusionSummary(participants, includedIds)}
      </p>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">این هزینه بین چه کسانی تقسیم شود؟</legend>
      <div className="flex flex-wrap items-center gap-1.5">
        {participants.map((p) => {
          const selected = includedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-label={p.name || "بدون نام"}
              onClick={() => onToggle(p.id)}
              className={[
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                selected
                  ? "border-sky-300/40 bg-sky-400/25 text-sky-100"
                  : "border-white/10 bg-white/5 text-white/40 hover:text-white/70",
              ].join(" ")}
            >
              {p.name || "بدون نام"}
              {selected ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <button
          type="button"
          onClick={onSelectAll}
          disabled={allSelected}
          className="rounded-md px-1.5 py-0.5 text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          انتخاب همه
        </button>
        <span aria-hidden="true" className="text-white/20">|</span>
        <button
          type="button"
          onClick={onClearAll}
          disabled={noneSelected}
          className="rounded-md px-1.5 py-0.5 text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          حذف انتخاب همه
        </button>
      </div>
      {noneSelected ? (
        <p className="text-xs text-rose-300" role="alert">
          حداقل یک نفر را برای تقسیم این هزینه انتخاب کنید.
        </p>
      ) : null}
    </fieldset>
  );
}