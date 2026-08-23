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
    const rotatedIndex = ((index - offset) % n + n) % n;
    shares.set(id, base + (rotatedIndex < remainder ? 1 : 0));
  });
  return shares;
}

interface PairTransferTotal {
  firstId: string;
  firstName: string;
  secondId: string;
  secondName: string;
  netFromFirstToSecond: number;
}

/** Aggregate and net transfers only within the same unordered participant pair. */
function normalizeTransfersByPair(transfers: readonly Transfer[]): Transfer[] {
  const totalsByPair = new Map<string, PairTransferTotal>();

  for (const transfer of transfers) {
    const fromIsFirst = transfer.fromId < transfer.toId;
    const firstId = fromIsFirst ? transfer.fromId : transfer.toId;
    const secondId = fromIsFirst ? transfer.toId : transfer.fromId;
    const pairKey = JSON.stringify([firstId, secondId]);
    const signedAmount = fromIsFirst ? transfer.amount : -transfer.amount;
    const existing = totalsByPair.get(pairKey);

    if (existing) {
      existing.netFromFirstToSecond += signedAmount;
    } else {
      totalsByPair.set(pairKey, {
        firstId,
        firstName: fromIsFirst ? transfer.fromName : transfer.toName,
        secondId,
        secondName: fromIsFirst ? transfer.toName : transfer.fromName,
        netFromFirstToSecond: signedAmount,
      });
    }
  }

  return [...totalsByPair.values()].flatMap((pair) => {
    if (pair.netFromFirstToSecond === 0) return [];
    const firstOwesSecond = pair.netFromFirstToSecond > 0;
    return [
      {
        fromId: firstOwesSecond ? pair.firstId : pair.secondId,
        fromName: firstOwesSecond ? pair.firstName : pair.secondName,
        toId: firstOwesSecond ? pair.secondId : pair.firstId,
        toName: firstOwesSecond ? pair.secondName : pair.firstName,
        amount: Math.abs(pair.netFromFirstToSecond),
      },
    ];
  });
}

/**
 * Compute balances, shares, and direct transfers to each expense payer.
 *
 * Each expense is divided independently: `expenseShare = amount /
 * includedParticipantIds.length`. The payer's `paid` total gets the full
 * amount; every included participant's `owed` total gets their share.
 * `balance = paid - owed`. Total debt always equals total credit because the
 * sum of all expense shares equals the sum of all expense amounts, and the
 * payer accounting matches the share accounting exactly.
 *
 * Transfers preserve the original payment relationships: each included
 * participant pays their share directly to the participant who paid the
 * expense. Transfers are then aggregated and netted only within the same
 * unordered participant pair; debts are never rerouted through a third person.
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
  const paidById = new Map(participants.map((p) => [p.id, 0]));
  const owedById = new Map(participants.map((p) => [p.id, 0]));
  const directTransfers: Transfer[] = [];

  // Expenses resolved with names for summary and sharing output.
  const resolvedExpenses: ResolvedExpense[] = [];

  let allSharedByAll = true;
  let expenseCounter = 0;

  for (const owner of participants) {
    for (const expense of owner.expenses) {
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

      const paidToDate = paidById.get(expense.paidByParticipantId) ?? 0;
      paidById.set(
        expense.paidByParticipantId,
        paidToDate + Math.round(expense.amount),
      );

      for (const [participantId, share] of shares) {
        const owedToDate = owedById.get(participantId) ?? 0;
        owedById.set(participantId, owedToDate + share);

        if (participantId === expense.paidByParticipantId || share === 0) {
          continue;
        }

        const payerId = expense.paidByParticipantId;
        directTransfers.push({
          fromId: participantId,
          fromName: nameById.get(participantId) ?? "—",
          toId: payerId,
          toName: nameById.get(payerId) ?? "—",
          amount: share,
        });
      }

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
    const paid = paidById.get(p.id) ?? 0;
    const owed = owedById.get(p.id) ?? 0;
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
    transfers: normalizeTransfersByPair(directTransfers),
    expenses: resolvedExpenses,
  };
}

/** Whether the group is fully settled (no transfers required). */
export function isFullySettled(result: SettlementResult): boolean {
  return result.transfers.length === 0;
}
