import type {
  BalanceResult,
  Participant,
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
 * Compute balances, shares, and a minimal set of transfers that settles the group.
 *
 * Rounding strategy: the base equal share is `floor(total / n)`. A remainder of
 * `total - baseShare * n` is distributed by adding 1 to the share of the first
 * `remainder` participants (ordered by their position in the list). This keeps
 * every share an integer, guarantees `sum(shares) === total`, and therefore
 * `sum(balances) === 0` — total debt always equals total credit, nothing lost.
 *
 * Settlement uses a greedy largest-debitor × largest-creditor pairing, which
 * produces at most `n - 1` transfers (the theoretical minimum).
 */
export function settle(participants: Participant[]): SettlementResult {
  const count = participants.length;
  const total = Math.round(totalExpenses(participants));

  if (count === 0) {
    return {
      totalExpenses: 0,
      participantCount: 0,
      sharePerPerson: 0,
      remainder: 0,
      balances: [],
      transfers: [],
    };
  }

  const baseShare = Math.floor(total / count);
  const remainder = total - baseShare * count;

  const balances: BalanceResult[] = participants.map((p, index) => {
    const paid = Math.round(paidBy(p));
    const share = baseShare + (index < remainder ? 1 : 0);
    const balance = paid - share;
    const status: BalanceResult["status"] =
      balance > 0 ? "creditor" : balance < 0 ? "debtor" : "settled";
    return { participantId: p.id, name: p.name, paid, share, balance, status };
  });

  return {
    totalExpenses: total,
    participantCount: count,
    sharePerPerson: baseShare,
    remainder,
    balances,
    transfers: generateTransfers(balances),
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