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
}

export interface Participant {
  id: string;
  name: string;
  expenses: Expense[];
}

export interface BalanceResult {
  participantId: string;
  name: string;
  paid: number;
  share: number;
  balance: number; // paid - share; >0 creditor, <0 debtor, 0 settled
  status: "creditor" | "debtor" | "settled";
}

export interface Transfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface SettlementResult {
  totalExpenses: number;
  participantCount: number;
  sharePerPerson: number; // base equal share (floored)
  remainder: number; // remainder distributed among first `remainder` people
  balances: BalanceResult[];
  transfers: Transfer[];
}

export interface AppState {
  participants: Participant[];
  currency: CurrencyCode;
}