export type CurrencyCode = "toman" | "rial" | "aed";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string; // Persian label used in sentences
  short: string; // short Persian label
}

export const CURRENCIES: readonly CurrencyInfo[] = [
  { code: "toman", label: "تومان", short: "تومان" },
  { code: "rial", label: "ریال", short: "ریال" },
  { code: "aed", label: "درهم", short: "درهم" },
] as const;

export interface Expense {
  id: string;
  title: string;
  amount: number; // integer, > 0
  paidByParticipantId: string;
  includedParticipantIds: string[]; // participants who share this expense
}

export interface Participant {
  id: string;
  name: string;
  expenses: Expense[];
}

export interface BalanceResult {
  participantId: string;
  name: string;
  paid: number; // total amount paid by this participant
  owed: number; // total share this participant owes across expenses
  balance: number; // paid - owed; >0 creditor, <0 debtor, 0 settled
  status: "creditor" | "debtor" | "settled";
}

export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

/** An expense resolved with payer and included participant names, for display. */
export interface ResolvedExpense {
  id: string;
  title: string;
  amount: number;
  paidByName: string;
  includedNames: string[];
}

export interface SettlementResult {
  totalExpenses: number;
  participantCount: number;
  /** True only when every expense includes every participant. */
  allSharedByAll: boolean;
  /** Equal share per person; meaningful only when allSharedByAll is true. */
  sharePerPerson: number;
  remainder: number;
  balances: BalanceResult[];
  transfers: Transfer[];
  expenses: ResolvedExpense[];
}

export interface AppState {
  participants: Participant[];
  currency: CurrencyCode;
}