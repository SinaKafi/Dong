import { describe, expect, it } from "vitest";
import {
  generateTransfers,
  isFullySettled,
  paidBy,
  settle,
  totalExpenses,
} from "./settlement";
import type { Participant } from "./types";

function p(id: string, name: string, expenses: { title: string; amount: number }[] = []): Participant {
  return {
    id,
    name,
    expenses: expenses.map((e, i) => ({ id: `${id}-e${i}`, title: e.title, amount: e.amount })),
  };
}

describe("totalExpenses", () => {
  it("sums all expenses across participants", () => {
    const list = [
      p("s", "سینا", [{ title: "شام", amount: 500000 }, { title: "بنزین", amount: 200000 }]),
      p("m", "مرتضی", [{ title: "بلیط", amount: 300000 }]),
    ];
    expect(totalExpenses(list)).toBe(1000000);
  });

  it("handles empty groups", () => {
    expect(totalExpenses([])).toBe(0);
  });

  it("handles participants with zero expenses", () => {
    expect(totalExpenses([p("a", "آ"), p("b", "ب")])).toBe(0);
  });
});

describe("paidBy", () => {
  it("sums a single participant's expenses", () => {
    expect(paidBy(p("s", "سینا", [{ title: "x", amount: 100 }, { title: "y", amount: 200 }]))).toBe(300);
  });
  it("is zero when there are no expenses", () => {
    expect(paidBy(p("s", "سینا"))).toBe(0);
  });
});

describe("settle — equal share", () => {
  it("computes equal share per person", () => {
    const list = [p("s", "سینا"), p("m", "مرتضی"), p("h", "حسام")];
    const r = settle(list);
    expect(r.totalExpenses).toBe(0);
    expect(r.sharePerPerson).toBe(0);
  });

  it("uses the documented example", () => {
    // Sina paid 11700, Morteza 18500, Hesam 10000. Total 40200, share 13400.
    const list = [
      p("s", "سینا", [{ title: "x", amount: 11700 }]),
      p("m", "مرتضی", [{ title: "x", amount: 18500 }]),
      p("h", "حسام", [{ title: "x", amount: 10000 }]),
    ];
    const r = settle(list);
    expect(r.totalExpenses).toBe(40200);
    expect(r.participantCount).toBe(3);
    expect(r.sharePerPerson).toBe(13400);
    expect(r.balances.map((b) => b.balance)).toEqual([-1700, 5100, -3400]);
    // Hesam pays 3400 to Morteza; Sina pays 1700 to Morteza (largest debtor first).
    expect(r.transfers).toEqual([
      { fromId: "h", fromName: "حسام", toId: "m", toName: "مرتضی", amount: 3400 },
      { fromId: "s", fromName: "سینا", toId: "m", toName: "مرتضی", amount: 1700 },
    ]);
  });
});

describe("settle — balances and statuses", () => {
  it("marks creditors, debtors, and settled participants", () => {
    const list = [
      p("s", "سینا", [{ title: "x", amount: 600 }]),
      p("m", "مرتضی", [{ title: "x", amount: 300 }]),
      p("h", "حسام", [{ title: "x", amount: 300 }]),
    ];
    const r = settle(list);
    // total 1200, share 400 each. Sina +200 creditor, Morteza -100, Hesam -100.
    const statuses = Object.fromEntries(r.balances.map((b) => [b.name, b.status]));
    expect(statuses["سینا"]).toBe("creditor");
    expect(statuses["مرتضی"]).toBe("debtor");
    expect(statuses["حسام"]).toBe("debtor");
  });

  it("marks a participant with zero balance as settled", () => {
    const list = [
      p("s", "سینا", [{ title: "x", amount: 500 }]),
      p("m", "مرتضی", [{ title: "x", amount: 500 }]),
    ];
    const r = settle(list);
    // total 1000, share 500 each. Both settled.
    expect(r.balances.every((b) => b.status === "settled")).toBe(true);
    expect(isFullySettled(r)).toBe(true);
  });
});

describe("settle — rounding consistency", () => {
  it("distributes remainder so total debt equals total credit", () => {
    // total 10 over 3 people -> base 3, remainder 1 -> shares [4,3,3].
    const list = [
      p("a", "آ", [{ title: "x", amount: 10 }]),
      p("b", "ب"),
      p("c", "ج"),
    ];
    const r = settle(list);
    const totalShare = r.balances.reduce((s, b) => s + b.share, 0);
    expect(totalShare).toBe(10); // no amount lost
    const totalDebt = r.balances.filter((b) => b.balance < 0).reduce((s, b) => s + -b.balance, 0);
    const totalCredit = r.balances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);
    expect(totalDebt).toBe(totalCredit);
  });

  it("sum of balances is always zero", () => {
    const cases = [
      [1, 2, 3],
      [10, 10, 10],
      [7, 11, 13, 19],
      [1000, 1, 1],
      [33, 33, 34],
    ];
    for (const amounts of cases) {
      const list = amounts.map((amt, i) =>
        p(`p${i}`, `ن${i}`, [{ title: "x", amount: amt }]),
      );
      const r = settle(list);
      const sum = r.balances.reduce((s, b) => s + b.balance, 0);
      expect(sum).toBe(0);
    }
  });
});

describe("generateTransfers — minimal transfers", () => {
  it("produces at most n-1 transfers", () => {
    const balances = settle([
      p("a", "آ", [{ title: "x", amount: 100 }]),
      p("b", "ب"),
      p("c", "ج"),
      p("d", "د"),
    ]).balances;
    const transfers = generateTransfers(balances);
    expect(transfers.length).toBeLessThanOrEqual(3);
  });

  it("returns no transfers when everyone is settled", () => {
    const balances = settle([
      p("a", "آ", [{ title: "x", amount: 500 }]),
      p("b", "ب", [{ title: "x", amount: 500 }]),
    ]).balances;
    expect(generateTransfers(balances)).toEqual([]);
  });
});

describe("settle — already-settled group", () => {
  it("has no transfers and no debtors/creditors", () => {
    const list = [
      p("a", "آ", [{ title: "x", amount: 100 }]),
      p("b", "ب", [{ title: "x", amount: 100 }]),
      p("c", "ج", [{ title: "x", amount: 100 }]),
    ];
    const r = settle(list);
    // total 300, share 100 each.
    expect(r.transfers).toEqual([]);
    expect(r.balances.every((b) => b.balance === 0)).toBe(true);
    expect(isFullySettled(r)).toBe(true);
  });
});

describe("settle — participants with zero expenses", () => {
  it("treats a no-expense participant as a full debtor", () => {
    const list = [
      p("a", "آ", [{ title: "x", amount: 1000 }]),
      p("b", "ب", [{ title: "x", amount: 1000 }]),
      p("c", "ج"),
    ];
    const r = settle(list);
    // total 2000, share ~667 each (base 666, remainder 2 -> shares 667,667,666).
    const c = r.balances.find((b) => b.name === "ج");
    expect(c?.status).toBe("debtor");
    expect(c?.balance).toBeLessThan(0);
  });
});

describe("settle — empty group", () => {
  it("returns a zeroed result for no participants", () => {
    const r = settle([]);
    expect(r.totalExpenses).toBe(0);
    expect(r.participantCount).toBe(0);
    expect(r.sharePerPerson).toBe(0);
    expect(r.balances).toEqual([]);
    expect(r.transfers).toEqual([]);
  });
});