import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearState, readState, writeState } from "./storage";

const KEY = "dong:state:v1";

/* Minimal in-memory localStorage stub so storage tests run under the node
 * environment without a jsdom dependency. Installed on a fake `window` so the
 * isBrowser() guard in storage.ts treats the environment as a browser. */
function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => {
      map.delete(k);
    },
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
}

let storage: Storage;

beforeEach(() => {
  storage = makeStorage();
  (globalThis as unknown as { window: unknown }).window = { localStorage: storage };
});

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
  storage.clear();
});

function setRaw(value: unknown): void {
  storage.setItem(KEY, JSON.stringify(value));
}

describe("storage migration", () => {
  it("initializes missing includedParticipantIds with all participant ids", () => {
    // Legacy expense: no paidByParticipantId, no includedParticipantIds.
    setRaw({
      currency: "toman",
      participants: [
        { id: "a", name: "آ", expenses: [{ id: "e1", title: "شام", amount: 1000 }] },
        { id: "b", name: "ب", expenses: [] },
        { id: "c", name: "ج", expenses: [] },
      ],
    });
    const state = readState()!;
    expect(state.participants[0].expenses[0].paidByParticipantId).toBe("a");
    expect(state.participants[0].expenses[0].includedParticipantIds).toEqual(["a", "b", "c"]);
  });

  it("preserves existing includedParticipantIds when present", () => {
    setRaw({
      currency: "toman",
      participants: [
        {
          id: "a",
          name: "آ",
          expenses: [
            {
              id: "e1",
              title: "تاکسی",
              amount: 400,
              paidByParticipantId: "a",
              includedParticipantIds: ["a", "b"],
            },
          ],
        },
        { id: "b", name: "ب", expenses: [] },
        { id: "c", name: "ج", expenses: [] },
      ],
    });
    const state = readState()!;
    expect(state.participants[0].expenses[0].includedParticipantIds).toEqual(["a", "b"]);
  });

  it("drops stale included ids that no longer reference a participant", () => {
    setRaw({
      currency: "toman",
      participants: [
        {
          id: "a",
          name: "آ",
          expenses: [
            {
              id: "e1",
              title: "x",
              amount: 100,
              paidByParticipantId: "a",
              includedParticipantIds: ["a", "ghost"],
            },
          ],
        },
        { id: "b", name: "ب", expenses: [] },
      ],
    });
    const state = readState()!;
    expect(state.participants[0].expenses[0].includedParticipantIds).toEqual(["a"]);
  });

  it("does not corrupt or delete other data", () => {
    setRaw({
      currency: "rial",
      participants: [
        { id: "a", name: "آ", expenses: [{ id: "e1", title: "x", amount: 500 }] },
        { id: "b", name: "ب", expenses: [] },
      ],
    });
    const state = readState()!;
    expect(state.currency).toBe("rial");
    expect(state.participants[0].name).toBe("آ");
    expect(state.participants[1].name).toBe("ب");
    expect(state.participants[0].expenses[0].amount).toBe(500);
  });

  it("returns null when storage is empty", () => {
    storage.removeItem(KEY);
    expect(readState()).toBeNull();
  });

  it("round-trips a fully-formed state through write then read", () => {
    const state = {
      currency: "toman" as const,
      participants: [
        {
          id: "a",
          name: "آ",
          expenses: [
            {
              id: "e1",
              title: "شام",
              amount: 900,
              paidByParticipantId: "a",
              includedParticipantIds: ["a", "b"],
            },
          ],
        },
        { id: "b", name: "ب", expenses: [] },
      ],
    };
    writeState(state);
    const back = readState()!;
    expect(back).toEqual(state);
  });

  it("clearState removes the persisted entry", () => {
    writeState({ currency: "toman", participants: [] });
    clearState();
    expect(readState()).toBeNull();
  });
});