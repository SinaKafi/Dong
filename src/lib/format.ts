import type { CurrencyCode, CurrencyInfo } from "./types";
import { CURRENCIES } from "./types";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const THOUSANDS_SEP = "٬"; // U+066C Arabic thousands separator

/** Convert a number to a Persian-digit string with thousands separators. */
export function toPersianDigits(value: number | string): string {
  const s = String(value);
  return s.replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

/** Format an integer amount with thousands separators and Persian digits. */
export function formatAmount(amount: number): string {
  const rounded = Math.round(amount);
  const withSep = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEP);
  return toPersianDigits(withSep);
}

/** Format an amount with its currency label, e.g. "۳٬۴۰۰ تومان". */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  return `${formatAmount(amount)} ${currencyLabel(currency)}`;
}

export function currencyLabel(code: CurrencyCode): string {
  return currencyInfo(code).label;
}

export function currencyInfo(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** Format a possibly-negative amount with a leading minus sign for display. */
export function formatSignedMoney(amount: number, currency: CurrencyCode): string {
  const sign = amount < 0 ? "−" : "";
  return `${sign}${formatMoney(Math.abs(amount), currency)}`;
}