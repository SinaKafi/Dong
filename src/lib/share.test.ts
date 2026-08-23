import { describe, expect, it } from "vitest";
import { buildShareText, transferSentence } from "./share";
import type { Participant, Transfer } from "./types";
import { settle } from "./settlement";

describe("transferSentence", () => {
  it("builds the canonical Persian sentence", () => {
    const t: Transfer = { fromId: "h", fromName: "حسام", toId: "m", toName: "مرتضی", amount: 3400 };
    expect(transferSentence(t, "toman")).toBe("حسام باید ۳٬۴۰۰ تومان به مرتضی پرداخت کند.");
  });
});

function p(id: string, name: string, expenses: { title: string; amount: number }[] = []): Participant {
  return {
    id,
    name,
    expenses: expenses.map((e, i) => ({ id: `${id}-e${i}`, title: e.title, amount: e.amount })),
  };
}

describe("buildShareText", () => {
  it("matches the required template for the documented example", () => {
    const list = [
      p("s", "سینا", [{ title: "شام", amount: 11700 }]),
      p("m", "مرتضی", [{ title: "تاکسی", amount: 18500 }]),
      p("h", "حسام", [{ title: "قهوه", amount: 10000 }]),
    ];
    const result = settle(list);
    const text = buildShareText(result, "toman");
    const expected = [
      "🧾 دنگ حساب",
      "",
      "کل هزینه: ۴۰٬۲۰۰ تومان",
      "دنگ هر نفر: ۱۳٬۴۰۰ تومان",
      "",
      "پرداختی‌ها:",
      "- سینا: ۱۱٬۷۰۰ تومان",
      "- مرتضی: ۱۸٬۵۰۰ تومان",
      "- حسام: ۱۰٬۰۰۰ تومان",
      "",
      "تسویه:",
      "حسام باید ۳٬۴۰۰ تومان به مرتضی پرداخت کند.",
      "سینا باید ۱٬۷۰۰ تومان به مرتضی پرداخت کند.",
    ].join("\n");
    expect(text).toBe(expected);
  });

  it("renders the settled message when no transfers are needed", () => {
    const list = [
      p("a", "آ", [{ title: "x", amount: 100 }]),
      p("b", "ب", [{ title: "x", amount: 100 }]),
    ];
    const result = settle(list);
    const text = buildShareText(result, "rial");
    expect(text).toContain("حساب همه تسویه است و نیازی به انتقال پول نیست.");
  });

  it("uses the requested currency label", () => {
    const list = [p("a", "آ", [{ title: "x", amount: 500 }]), p("b", "ب", [{ title: "x", amount: 100 }])];
    const result = settle(list);
    const text = buildShareText(result, "aed");
    expect(text).toContain("درهم");
  });
});