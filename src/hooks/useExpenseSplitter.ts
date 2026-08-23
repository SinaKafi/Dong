"use client";

import { useCallback, useSyncExternalStore } from "react";
import { makeId } from "@/lib/id";
import { clearState, readState, writeState } from "@/lib/storage";
import type { AppState, CurrencyCode } from "@/lib/types";

/** Deterministic initial state -- identical on server and client to avoid hydration mismatches. */
const INITIAL_STATE: AppState = {
  currency: "toman",
  participants: [
    { id: "p-1", name: "", expenses: [] },
    { id: "p-2", name: "", expenses: [] },
  ],
};

/* Module-level store backed by localStorage. */

let current: AppState | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}

/** Client snapshot. Lazily reads localStorage on first access, then stays cached. */
function getSnapshot(): AppState {
  if (current === null) {
    const saved = readState();
    current = saved !== null && saved.participants.length > 0 ? normalizeToMinimum(saved) : INITIAL_STATE;
  }
  return current;
}

/** Server snapshot -- always the initial state. */
function getServerSnapshot(): AppState {
  return INITIAL_STATE;
}

function update(next: AppState): void {
  current = next;
  writeState(next);
  notify();
}

/** Ensure at least two participants after restoring from storage. */
function normalizeToMinimum(state: AppState): AppState {
  const participants = [...state.participants];
  while (participants.length < 2) {
    participants.push({ id: makeId(), name: "", expenses: [] });
  }
  return { ...state, participants };
}

/** Remove a deleted participant's id from every expense's included list. */
function pruneParticipantFromExpenses(participants: AppState["participants"], removedId: string): AppState["participants"] {
  return participants.map((p) => ({
    ...p,
    expenses: p.expenses.map((e) => ({
      ...e,
      includedParticipantIds: e.includedParticipantIds.filter((id) => id !== removedId),
    })),
  }));
}

/**
 * Owns participants/currency state, persisted to localStorage, and exposes
 * validation-returning actions. Reads go through useSyncExternalStore so the
 * server render and hydration use the same initial state (no mismatch), and
 * the saved state takes over right after mount.
 */
export function useExpenseSplitter() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    update({ ...getSnapshot(), currency });
  }, []);

  const addParticipant = useCallback(() => {
    const s = getSnapshot();
    // New participants are NOT added to existing expenses.
    update({ ...s, participants: [...s.participants, { id: makeId(), name: "", expenses: [] }] });
  }, []);

  /** Returns a Persian error message, or null on success. */
  const updateName = useCallback((id: string, name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed === "") return "نام نمی‌تواند خالی باشد.";
    const s = getSnapshot();
    if (s.participants.some((p) => p.id !== id && p.name.trim() === trimmed)) {
      return "این نام قبلاً ثبت شده است.";
    }
    update({
      ...s,
      participants: s.participants.map((p) => (p.id === id ? { ...p, name } : p)),
    });
    return null;
  }, []);

  /** Returns a Persian error message, or null on success. */
  const removeParticipant = useCallback((id: string): string | null => {
    const s = getSnapshot();
    if (s.participants.length <= 2) return "حداقل دو نفر باید در حساب باشند.";
    const without = s.participants.filter((p) => p.id !== id);
    const pruned = pruneParticipantFromExpenses(without, id);
    update({ ...s, participants: pruned });
    return null;
  }, []);

  /** Returns a Persian error message, or null on success. */
  const addExpense = useCallback(
    (payerId: string, title: string, amount: number, includedIds: string[]): string | null => {
      const trimmedTitle = title.trim();
      if (trimmedTitle === "") return "عنوان هزینه نمی‌تواند خالی باشد.";
      if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
        return "مبلغ باید عدد صحیح و بزرگ‌تر از صفر باشد.";
      }
      const s = getSnapshot();
      const existingIds = new Set(s.participants.map((p) => p.id));
      const validIncluded = includedIds.filter((id) => existingIds.has(id));
      if (validIncluded.length === 0) {
        return "حداقل یک نفر را برای تقسیم این هزینه انتخاب کنید.";
      }
      update({
        ...s,
        participants: s.participants.map((p) =>
          p.id === payerId
            ? {
                ...p,
                expenses: [
                  ...p.expenses,
                  {
                    id: makeId(),
                    title: trimmedTitle,
                    amount,
                    paidByParticipantId: payerId,
                    includedParticipantIds: validIncluded,
                  },
                ],
              }
            : p,
        ),
      });
      return null;
    },
    [],
  );

  /** Toggle a participant's inclusion on an expense. Returns error or null. */
  const setExpenseIncluded = useCallback(
    (payerId: string, expenseId: string, includedIds: string[]): string | null => {
      const s = getSnapshot();
      const existingIds = new Set(s.participants.map((p) => p.id));
      const validIncluded = includedIds.filter((id) => existingIds.has(id));
      if (validIncluded.length === 0) {
        return "حداقل یک نفر را برای تقسیم این هزینه انتخاب کنید.";
      }
      update({
        ...s,
        participants: s.participants.map((p) =>
          p.id === payerId
            ? {
                ...p,
                expenses: p.expenses.map((e) =>
                  e.id === expenseId ? { ...e, includedParticipantIds: validIncluded } : e,
                ),
              }
            : p,
        ),
      });
      return null;
    },
    [],
  );

  const removeExpense = useCallback((participantId: string, expenseId: string) => {
    const s = getSnapshot();
    update({
      ...s,
      participants: s.participants.map((p) =>
        p.id === participantId ? { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) } : p,
      ),
    });
  }, []);

  const reset = useCallback(() => {
    current = INITIAL_STATE;
    clearState();
    notify();
  }, []);

  return {
    state,
    setCurrency,
    addParticipant,
    updateName,
    removeParticipant,
    addExpense,
    setExpenseIncluded,
    removeExpense,
    reset,
  };
}