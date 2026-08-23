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
    update({ ...s, participants: s.participants.filter((p) => p.id !== id) });
    return null;
  }, []);

  /** Returns a Persian error message, or null on success. */
  const addExpense = useCallback((participantId: string, title: string, amount: number): string | null => {
    const trimmedTitle = title.trim();
    if (trimmedTitle === "") return "عنوان هزینه نمی‌تواند خالی باشد.";
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
      return "مبلغ باید عدد صحیح و بزرگ‌تر از صفر باشد.";
    }
    const s = getSnapshot();
    update({
      ...s,
      participants: s.participants.map((p) =>
        p.id === participantId
          ? { ...p, expenses: [...p.expenses, { id: makeId(), title: trimmedTitle, amount }] }
          : p,
      ),
    });
    return null;
  }, []);

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
    removeExpense,
    reset,
  };
}