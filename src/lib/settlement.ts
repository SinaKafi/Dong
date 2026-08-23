import type {
  BalanceResult,
  Participant,
  ResolvedExpense,
  SettlementResult,
  Transfer,
} from "./types";

/** Total of every expense across all participants. */
export function totalExpenses(participants: Participant[]): number {
  return participants.reduce(
    (sum, p) => sum + p.expenses.reduce((s, e) => s + e.amount, 0),
    0,
  );
}

/** Total amount a single participant has paid. */
export function paidBy(participant: Participant): number {
  return participant.expenses.reduce((s, e) => s + e.amount, 0);
}

/**
 * Distribute an expense amount evenly across the included participants,
 * returning a map of participantId -> integer share whose values sum to
 * `amount` (floor + remainder distributed to the first `remainder`
 * participants, rotated by `offset` so the same person is not always
 * favored when multiple expenses split unevenly).
 */
function expenseShareMap(
  amount: number,
  includedIds: readonly string[],
  offset = 0,
): Map<string, number> {
  const shares = new Map<string, number>();
  const n = includedIds.length;
  if (n === 0) return shares;
  const base = Math.floor(amount / n);
  const remainder = amount - base * n;
  includedIds.forEach((id, index) => {
    // Rotate the remainder recipients so rounding bias is spread across
    // participants rather than always landing on index 0.
    const rotatedIndex = (index - offset + n) % n;
    shares.set(id, base + (rotatedIndex < remainder ? 1 : 0));
  });
  return shares;
}

/**
 * Compute balances, shares, and a minimal set of transfers that settles the group.
 *
 * Each expense is divided independently: `expenseShare = amount /
 * includedParticipantIds.length`. The payer's `paid` total gets the full
 * amount; every included participant's `owed` total gets their share.
 * `balance = paid - owed`. Total debt always equals total credit because the
 * sum of all expense shares equals the sum of all expense amounts, and the
 * payer accounting matches the share accounting exactly.
 *
 * Settlement uses a greedy largest-debtor × largest-creditor pairing, which
 * produces at most `n - 1` transfers (the theoretical minimum).
 */
export function settle(participants: Participant[]): SettlementResult {
  const count = participants.length;
  const total = Math.round(totalExpenses(participants));

  if (count === 0) {
    return {
      totalExpenses: 0,
      participantCount: 0,
      allSharedByAll: true,
      sharePerPerson: 0,
      remainder: 0,
      balances: [],
      transfers: [],
      expenses: [],
    };
  }

  const nameById = new Map(participants.map((p) => [p.id, p.name]));

  // Per-expense share maps, keyed by expense id.
  const expenseShares = new Map<string, Map<string, number>>();
  const resolvedExpenses: ResolvedExpense[] = [];

  let allSharedByAll = true;
  let expenseCounter = 0;

  for (const payer of participants) {
    for (const expense of payer.expenses) {
      // Drop included ids that no longer exist (participant was deleted).
      const includedIds = expense.includedParticipantIds.filter((id) =>
        nameById.has(id),
      );
      // "All shared by all" means every current participant is included in
      // every expense. Stale ids were already filtered out, so compare against
      // the current participant set, not the raw stored list.
      if (includedIds.length !== count) {
        allSharedByAll = false;
      }

      const shares = expenseShareMap(
        Math.round(expense.amount),
        includedIds,
        expenseCounter,
      );
      expenseCounter += 1;
      expenseShares.set(expense.id, shares);

      resolvedExpenses.push({
        id: expense.id,
        title: expense.title,
        amount: Math.round(expense.amount),
        paidByName: nameById.get(expense.paidByParticipantId) ?? "—",
        includedNames: includedIds.map((id) => nameById.get(id) ?? "—"),
      });
    }
  }

  // If there are no expenses, "all shared by all" is vacuously true.
  if (resolvedExpenses.length === 0) allSharedByAll = true;

  const balances: BalanceResult[] = participants.map((p) => {
    const paid = Math.round(paidBy(p));
    let owed = 0;
    for (const [, shares] of expenseShares) {
      const share = shares.get(p.id);
      if (share != null) owed += share;
    }
    const balance = paid - owed;
    const status: BalanceResult["status"] =
      balance > 0 ? "creditor" : balance < 0 ? "debtor" : "settled";
    return { participantId: p.id, name: p.name, paid, owed, balance, status };
  });

  const baseShare = Math.floor(total / count);
  const remainder = total - baseShare * count;

  return {
    totalExpenses: total,
    participantCount: count,
    allSharedByAll,
    sharePerPerson: baseShare,
    remainder,
    balances,
    transfers: generateTransfers(balances),
    expenses: resolvedExpenses,
  };
}

/**
 * Produce the minimal transfer list from a set of balances whose sum is zero.
 * Greedy: always pair the largest debtor with the largest creditor.
 */
export function generateTransfers(balances: BalanceResult[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.balance < 0)
    .map((b) => ({ id: b.participantId, name: b.name, amount: -b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.balance > 0)
    .map((b) => ({ id: b.participantId, name: b.name, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const transfers: Transfer[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di];
    const creditor = creditors[ci];
    if (debtor.amount === 0) {
      di++;
      continue;
    }
    if (creditor.amount === 0) {
      ci++;
      continue;
    }
    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({
      fromId: debtor.id,
      fromName: debtor.name,
      toId: creditor.id,
      toName: creditor.name,
      amount,
    });
    debtor.amount -= amount;
    creditor.amount -= amount;
    if (debtor.amount === 0) di++;
    if (creditor.amount === 0) ci++;
  }

  return transfers;
}

/** Whether the group is fully settled (no transfers required). */
export function isFullySettled(result: SettlementResult): boolean {
  return result.transfers.length === 0;
}