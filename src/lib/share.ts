import { formatMoney } from "./format";
import type { CurrencyCode, SettlementResult, Transfer } from "./types";

/**
 * Build the shareable Persian report:
 *
 * 🧾 دنگ حساب
 *
 * کل هزینه: [amount] [currency]
 * دنگ هر نفر: [amount] [currency]
 *
 * پرداختی‌ها:
 * - [name]: [amount] [currency]
 *
 * تسویه:
 * - [debtor] باید [amount] [currency] به [creditor] بدهد.
 */
export function buildShareText(result: SettlementResult, currency: CurrencyCode): string {
  const lines: string[] = ["🧾 دنگ حساب", ""];

  lines.push(`کل هزینه: ${formatMoney(result.totalExpenses, currency)}`);
  lines.push(`دنگ هر نفر: ${formatMoney(result.sharePerPerson, currency)}`);
  lines.push("");

  lines.push("پرداختی‌ها:");
  for (const b of result.balances) {
    lines.push(`- ${b.name}: ${formatMoney(b.paid, currency)}`);
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
