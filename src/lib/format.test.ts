import { describe, expect, it } from "vitest";
import { formatAmount, formatMoney, toPersianDigits } from "./format";

describe("toPersianDigits", () => {
  it("converts ASCII digits to Persian", () => {
    expect(toPersianDigits("0123456789")).toBe("۰۱۲۳۴۵۶۷۸۹");
  });

  it("leaves non-digit characters intact", () => {
    expect(toPersianDigits("Toman-123")).toBe("Toman-۱۲۳");
  });

  it("handles numeric input", () => {
    expect(toPersianDigits(1234)).toBe("۱۲۳۴");
  });
});

describe("formatAmount", () => {
  it("inserts thousands separators with Persian digits", () => {
    expect(formatAmount(13400)).toBe("۱۳٬۴۰۰");
    expect(formatAmount(40200)).toBe("۴۰٬۲۰۰");
    expect(formatAmount(11700)).toBe("۱۱٬۷۰۰");
    expect(formatAmount(18500)).toBe("۱۸٬۵۰۰");
    expect(formatAmount(1000000)).toBe("۱٬۰۰۰٬۰۰۰");
  });

  it("does not add separators to small numbers", () => {
    expect(formatAmount(0)).toBe("۰");
    expect(formatAmount(7)).toBe("۷");
  });

  it("rounds non-integer values", () => {
    expect(formatAmount(13400.7)).toBe("۱۳٬۴۰۱");
    expect(formatAmount(13400.3)).toBe("۱۳٬۴۰۰");
  });
});

describe("formatMoney", () => {
  it("appends the currency label", () => {
    expect(formatMoney(13400, "toman")).toBe("۱۳٬۴۰۰ تومان");
    expect(formatMoney(100, "rial")).toBe("۱۰۰ ریال");
    expect(formatMoney(250, "aed")).toBe("۲۵۰ درهم");
  });
});