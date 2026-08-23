import type { AppState, CurrencyCode, Participant } from "./types";

const STORAGE_KEY = "dong:state:v1";

const EMPTY_STATE: AppState = {
  participants: [],
  currency: "toman",
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Read persisted state. Returns null if absent or unreadable (never throws). */
export function readState(): AppState | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as unknown;
    return normalizeState(parsed);
  } catch {
    return null;
  }
}

/** Write state to localStorage. Swallows quota/serialization errors. */
export function writeState(state: AppState): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function clearState(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function normalizeState(parsed: unknown): AppState {
  if (typeof parsed !== "object" || parsed === null) return EMPTY_STATE;
  const obj = parsed as Record<string, unknown>;
  const currency = normalizeCurrency(obj["currency"]);
  const participants = normalizeParticipants(obj["participants"]);
  return { participants, currency };
}

function normalizeCurrency(v: unknown): CurrencyCode {
  if (v === "toman" || v === "rial" || v === "aed") return v;
  return "toman";
}

function normalizeParticipants(v: unknown): Participant[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p) => {
    const norm = normalizeParticipant(p);
    return norm ? [norm] : [];
  });
}

function normalizeParticipant(v: unknown): Participant | null {
  if (typeof v !== "object" || v === null) return null;
  const obj = v as Record<string, unknown>;
  const id = obj["id"];
  const name = obj["name"];
  if (!isString(id) || !isString(name)) return null;
  return { id, name, expenses: normalizeExpenses(obj["expenses"]) };
}

function normalizeExpenses(v: unknown): { id: string; title: string; amount: number }[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((e) => {
    if (typeof e !== "object" || e === null) return [];
    const obj = e as Record<string, unknown>;
    const id = obj["id"];
    const title = obj["title"];
    const amount = obj["amount"];
    if (!isString(id) || !isString(title) || typeof amount !== "number") return [];
    if (!Number.isFinite(amount) || amount <= 0) return [];
    return [{ id, title, amount: Math.round(amount) }];
  });
}
