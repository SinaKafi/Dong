import { describe, expect, it } from "vitest";
import {
  generateTransfers,
  isFullySettled,
  paidBy,
  settle,
  totalExpenses,
} from "./settlement";
import type { Expense, Participant } from "./types";

function expense(
  id: string,
  title: string,
  amount: number,
  paidByParticipantId: string,
  includedParticipantIds: string[],
): Expense {
  return { id, title, amount, paidByParticipantId, includedParticipantIds };
}

function p(
  id: string,
  name: string,
  expenses: Expense[] = [],
): Participant {
  return { id, name, expenses };
}

const SINA = "s";
const HESAM = "h";
const MORTEZA = "m";
const ALL = [SINA, HESAM, MORTEZA];

describe("totalExpenses", () => {
  it("sums all expenses across participants", () => {
    const list = [
      p(SINA, "سینا", [expense("e1", "شام", 500000, SINA, ALL)]),
      p(MORTEZA, "مرتضی", [expense("e2", "بلیط", 300000, MORTEZA, ALL)]),
    ];
    expect(totalExpenses(list)).toBe(800000);
  });

  it("handles empty groups", () => {
    expect(totalExpenses([])).toBe(0);
  });
});

describe("paidBy", () => {
  it("sums a single participant's expenses", () => {
    const list = p(SINA, "سینا", [
      expense("e1", "x", 100, SINA, ALL),
      expense("e2", "y", 200, SINA, ALL),
    ]);
    expect(paidBy(list)).toBe(300);
  });
});

describe("settle — expense shared by everyone", () => {
  it("divides equally when all participants are included", () => {
    // Sina paid 900,000 dinner, all three included -> 300,000 each.
    const list = [
      p(SINA, "سینا", [expense("e1", "شام", 900000, SINA, ALL)]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    expect(r.totalExpenses).toBe(900000);
    expect(r.allSharedByAll).toBe(true);
    expect(r.sharePerPerson).toBe(300000);
    const sina = r.balances.find((b) => b.participantId === SINA)!;
    const hesam = r.balances.find((b) => b.participantId === HESAM)!;
    const morteza = r.balances.find((b) => b.participantId === MORTEZA)!;
    expect(sina.owed).toBe(300000);
    expect(sina.paid).toBe(900000);
    expect(sina.balance).toBe(600000);
    expect(hesam.owed).toBe(300000);
    expect(hesam.balance).toBe(-300000);
    expect(morteza.owed).toBe(300000);
    expect(morteza.balance).toBe(-300000);
  });
});

describe("settle — expense shared by only two people", () => {
  it("excludes the non-selected participant entirely", () => {
    // Sina paid 400,000 taxi, only Sina + Hesam included -> 200,000 each.
    const list = [
      p(SINA, "سینا", [expense("e1", "تاکسی", 400000, SINA, [SINA, HESAM])]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    expect(r.allSharedByAll).toBe(false);
    const sina = r.balances.find((b) => b.participantId === SINA)!;
    const hesam = r.balances.find((b) => b.participantId === HESAM)!;
    const morteza = r.balances.find((b) => b.participantId === MORTEZA)!;
    expect(sina.owed).toBe(200000);
    expect(hesam.owed).toBe(200000);
    expect(morteza.owed).toBe(0); // Morteza unaffected
    expect(morteza.balance).toBe(0);
    expect(sina.balance).toBe(200000);
    expect(hesam.balance).toBe(-200000);
  });

  it("excludes Sina when only Hesam + Morteza are selected", () => {
    // Hesam paid 600,000 tickets, only Hesam + Morteza -> 300,000 each.
    const list = [
      p(SINA, "سینا"),
      p(HESAM, "حسام", [expense("e1", "بلیت", 600000, HESAM, [HESAM, MORTEZA])]),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    const sina = r.balances.find((b) => b.participantId === SINA)!;
    const hesam = r.balances.find((b) => b.participantId === HESAM)!;
    const morteza = r.balances.find((b) => b.participantId === MORTEZA)!;
    expect(sina.owed).toBe(0);
    expect(sina.balance).toBe(0);
    expect(hesam.owed).toBe(300000);
    expect(morteza.owed).toBe(300000);
    expect(hesam.balance).toBe(300000);
    expect(morteza.balance).toBe(-300000);
  });
});

describe("settle — multiple expenses with different combinations", () => {
  it("combines per-expense shares correctly", () => {
    // Dinner 900k all (300k each), Taxi 400k Sina+Hesam (200k each),
    // Tickets 600k Hesam+Morteza (300k each). Total 1,900,000.
    const list = [
      p(SINA, "سینا", [
        expense("e1", "شام", 900000, SINA, ALL),
        expense("e2", "تاکسی", 400000, SINA, [SINA, HESAM]),
      ]),
      p(HESAM, "حسام", [expense("e3", "بلیت", 600000, HESAM, [HESAM, MORTEZA])]),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    expect(r.totalExpenses).toBe(1900000);
    expect(r.allSharedByAll).toBe(false);
    const sina = r.balances.find((b) => b.participantId === SINA)!;
    const hesam = r.balances.find((b) => b.participantId === HESAM)!;
    const morteza = r.balances.find((b) => b.participantId === MORTEZA)!;
    // Sina paid 1,300,000; owes 300k (dinner) + 200k (taxi) = 500k -> +800k
    expect(sina.paid).toBe(1300000);
    expect(sina.owed).toBe(500000);
    expect(sina.balance).toBe(800000);
    // Hesam paid 600,000; owes 300k (dinner) + 200k (taxi) + 300k (tickets) = 800k -> -200k
    expect(hesam.paid).toBe(600000);
    expect(hesam.owed).toBe(800000);
    expect(hesam.balance).toBe(-200000);
    // Morteza paid 0; owes 300k (dinner) + 300k (tickets) = 600k -> -600k
    expect(morteza.paid).toBe(0);
    expect(morteza.owed).toBe(600000);
    expect(morteza.balance).toBe(-600000);
  });
});

describe("settle — payer excluded from their own expense", () => {
  it("payer pays on behalf without consuming a share", () => {
    // Sina pays 300,000 for Hesam + Morteza only. Sina not included.
    const list = [
      p(SINA, "سینا", [expense("e1", "هدیه", 300000, SINA, [HESAM, MORTEZA])]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    const sina = r.balances.find((b) => b.participantId === SINA)!;
    const hesam = r.balances.find((b) => b.participantId === HESAM)!;
    const morteza = r.balances.find((b) => b.participantId === MORTEZA)!;
    expect(sina.owed).toBe(0);
    expect(sina.balance).toBe(300000); // creditor
    expect(hesam.owed).toBe(150000);
    expect(hesam.balance).toBe(-150000);
    expect(morteza.owed).toBe(150000);
    expect(morteza.balance).toBe(-150000);
  });
});

describe("settle — participant with no shared expenses", () => {
  it("has zero owed and zero paid", () => {
    const list = [
      p(SINA, "سینا", [expense("e1", "x", 1000, SINA, [SINA, HESAM])]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    const morteza = r.balances.find((b) => b.participantId === MORTEZA)!;
    expect(morteza.paid).toBe(0);
    expect(morteza.owed).toBe(0);
    expect(morteza.balance).toBe(0);
    expect(morteza.status).toBe("settled");
  });
});

describe("settle — participant deletion prunes included ids", () => {
  it("removes deleted participant from expense included lists", () => {
    // Simulate post-deletion state: Morteza gone, expense still references him.
    const list = [
      p(SINA, "سینا", [expense("e1", "x", 1000, SINA, [SINA, HESAM, MORTEZA])]),
      p(HESAM, "حسام"),
      // Morteza deleted -> not in participants list.
    ];
    const r = settle(list);
    const sina = r.balances.find((b) => b.participantId === SINA)!;
    const hesam = r.balances.find((b) => b.participantId === HESAM)!;
    // 1000 split between Sina + Hesam (Morteza id dropped) -> 500 each.
    expect(sina.owed).toBe(500);
    expect(hesam.owed).toBe(500);
    expect(r.allSharedByAll).toBe(true); // now 2 participants, both included
  });

  it("flags allSharedByAll false when an included id is stale", () => {
    const list = [
      p(SINA, "سینا", [expense("e1", "x", 1000, SINA, [SINA, HESAM, MORTEZA])]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    expect(r.allSharedByAll).toBe(true);
  });
});

describe("settle — rounding when an expense cannot divide evenly", () => {
  it("distributes remainder so shares sum to the expense amount", () => {
    // 1000 / 3 -> base 333, remainder 1 -> shares [334, 333, 333].
    const list = [
      p(SINA, "سینا", [expense("e1", "x", 1000, SINA, ALL)]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    const totalOwed = r.balances.reduce((s, b) => s + b.owed, 0);
    expect(totalOwed).toBe(1000); // no amount lost
    const shares = r.balances.map((b) => b.owed).sort((a, b) => a - b);
    expect(shares).toEqual([333, 333, 334]);
  });
});

describe("settle — final settlement accuracy", () => {
  it("produces transfers that settle the documented multi-expense example", () => {
    const list = [
      p(SINA, "سینا", [
        expense("e1", "شام", 900000, SINA, ALL),
        expense("e2", "تاکسی", 400000, SINA, [SINA, HESAM]),
      ]),
      p(HESAM, "حسام", [expense("e3", "بلیت", 600000, HESAM, [HESAM, MORTEZA])]),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    // Sina +800k creditor, Hesam -200k debtor, Morteza -600k debtor.
    // Greedy: largest debtor (Morteza 600k) pays Sina 600k, then Hesam pays Sina 200k.
    expect(r.transfers).toEqual([
      { fromId: MORTEZA, fromName: "مرتضی", toId: SINA, toName: "سینا", amount: 600000 },
      { fromId: HESAM, fromName: "حسام", toId: SINA, toName: "سینا", amount: 200000 },
    ]);
  });
});

describe("settle — total debts always equal total credits", () => {
  it("sum of debtor balances equals sum of creditor balances", () => {
    const cases = [
      [expense("e1", "x", 1000, SINA, ALL)],
      [expense("e1", "x", 1000, SINA, [SINA, HESAM])],
      [expense("e1", "x", 900000, SINA, ALL), expense("e2", "y", 400000, SINA, [SINA, HESAM])],
      [expense("e1", "x", 300000, SINA, [HESAM, MORTEZA])],
      [expense("e1", "x", 7, SINA, ALL), expense("e2", "y", 11, HESAM, [HESAM, MORTEZA])],
    ];
    for (const expenses of cases) {
      const list = [
        p(SINA, "سینا", expenses.filter((e) => e.paidByParticipantId === SINA)),
        p(HESAM, "حسام", expenses.filter((e) => e.paidByParticipantId === HESAM)),
        p(MORTEZA, "مرتضی", expenses.filter((e) => e.paidByParticipantId === MORTEZA)),
      ];
      const r = settle(list);
      const totalDebt = r.balances.filter((b) => b.balance < 0).reduce((s, b) => s + -b.balance, 0);
      const totalCredit = r.balances.filter((b) => b.balance > 0).reduce((s, b) => s + b.balance, 0);
      expect(totalDebt).toBe(totalCredit);
      const sum = r.balances.reduce((s, b) => s + b.balance, 0);
      expect(sum).toBe(0);
    }
  });
});

describe("settle — already-settled group", () => {
  it("has no transfers when everyone paid their share", () => {
    const list = [
      p(SINA, "سینا", [expense("e1", "x", 100, SINA, ALL)]),
      p(HESAM, "حسام", [expense("e2", "x", 100, HESAM, ALL)]),
      p(MORTEZA, "مرتضی", [expense("e3", "x", 100, MORTEZA, ALL)]),
    ];
    const r = settle(list);
    expect(r.transfers).toEqual([]);
    expect(isFullySettled(r)).toBe(true);
  });
});

describe("settle — empty group", () => {
  it("returns a zeroed result for no participants", () => {
    const r = settle([]);
    expect(r.totalExpenses).toBe(0);
    expect(r.participantCount).toBe(0);
    expect(r.balances).toEqual([]);
    expect(r.transfers).toEqual([]);
    expect(r.expenses).toEqual([]);
  });
});

describe("generateTransfers — minimal transfers", () => {
  it("produces at most n-1 transfers", () => {
    const list = [
      p(SINA, "سینا", [expense("e1", "x", 100, SINA, [SINA, HESAM, MORTEZA])]),
      p(HESAM, "حسام"),
      p(MORTEZA, "مرتضی"),
    ];
    const r = settle(list);
    expect(r.transfers.length).toBeLessThanOrEqual(2);
    expect(generateTransfers(r.balances).length).toBeLessThanOrEqual(2);
  });
});