import { formatMoney } from "./format";
import type { CurrencyCode, SettlementResult, Transfer } from "./types";

/** Join Persian names with "،" and a final "و": "سینا، حسام و مرتضی". */
export function joinNames(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join("، ")} و ${names[names.length - 1]}`;
}

/**
 * Build the shareable Persian report:
 *
 * 🧾 دنگ حساب
 *
 * کل هزینه: [amount] [currency]
 *
 * هزینه‌ها:
 * - [title] -- [amount] [currency]
 *   پرداخت‌کننده: [payer]
 *   تقسیم بین: [names]
 *
 * سهم نهایی افراد:
 * - [name]: [owed]
 *
 * تسویه:
 * - [debtor] باید [amount] [currency] به [creditor] بدهد.
 */
export function buildShareText(result: SettlementResult, currency: CurrencyCode): string {
  const lines: string[] = ["🧾 دنگ حساب", ""];

  lines.push(`کل هزینه: ${formatMoney(result.totalExpenses, currency)}`);
  lines.push("");

  lines.push("هزینه‌ها:");
  if (result.expenses.length === 0) {
    lines.push("- هزینه‌ای ثبت نشده است.");
  } else {
    for (const e of result.expenses) {
      lines.push(`- ${e.title} -- ${formatMoney(e.amount, currency)}`);
      lines.push(`  پرداخت‌کننده: ${e.paidByName}`);
      lines.push(`  تقسیم بین: ${joinNames(e.includedNames)}`);
    }
  }
  lines.push("");

  lines.push("سهم نهایی افراد:");
  for (const b of result.balances) {
    lines.push(`- ${b.name}: ${formatMoney(b.owed, currency)}`);
  }
  lines.push("");

  lines.push("تسویه:");
  if (result.transfers.length === 0) {
    lines.push("حساب همه تسویه است و نیازی به انتقال پول نیست.");
  } else {
    for (const t of result.transfers) {
      lines.push(transferSentence(t, currency));
    }
  }

  return lines.join("\n");
}

/** "حسام باید ۳٬۴۰۰ تومان به مرتضی پرداخت کند." */
export function transferSentence(transfer: Transfer, currency: CurrencyCode): string {
  return `${transfer.fromName} باید ${formatMoney(transfer.amount, currency)} به ${transfer.toName} پرداخت کند.`;
}