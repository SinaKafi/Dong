import { describe, expect, it } from "vitest";
import { buildShareText, joinNames, transferSentence } from "./share";
import type { Expense, Participant, Transfer } from "./types";
import { settle } from "./settlement";

function expense(
  id: string,
  title: string,
  amount: number,
  paidByParticipantId: string,
  includedParticipantIds: string[],
): Expense {
  return { id, title, amount, paidByParticipantId, includedParticipantIds };
}

function p(id: string, name: string, expenses: Expense[] = []): Participant {
  return { id, name, expenses };
}

describe("joinNames", () => {
  it("returns the single name unchanged", () => {
    expect(joinNames(["سینا"])).toBe("سینا");
  });
  it("joins two names with و", () => {
    expect(joinNames(["سینا", "حسام"])).toBe("سینا و حسام");
  });
  it("joins three names with ، and و", () => {
    expect(joinNames(["سینا", "حسام", "مرتضی"])).toBe("سینا، حسام و مرتضی");
  });
});

describe("transferSentence", () => {
  it("builds the canonical Persian sentence", () => {
    const t: Transfer = { fromId: "h", fromName: "حسام", toId: "m", toName: "مرتضی", amount: 3400 };
    expect(transferSentence(t, "toman")).toBe("حسام باید ۳٬۴۰۰ تومان به مرتضی پرداخت کند.");
  });
});

describe("buildShareText", () => {
  it("matches the required template with expense participants", () => {
    const list = [
      p("s", "سینا", [
        expense("e1", "شام", 900000, "s", ["s", "h", "m"]),
        expense("e2", "تاکسی", 400000, "s", ["s", "h"]),
      ]),
      p("h", "حسام", [expense("e3", "بلیت", 600000, "h", ["h", "m"])]),
      p("m", "مرتضی"),
    ];
    const result = settle(list);
    const text = buildShareText(result, "toman");
    const expected = [
      "🧾 دنگ حساب",
      "",
      "کل هزینه: ۱٬۹۰۰٬۰۰۰ تومان",
      "",
      "هزینه‌ها:",
      "- شام -- ۹۰۰٬۰۰۰ تومان",
      "  پرداخت‌کننده: سینا",
      "  تقسیم بین: سینا، حسام و مرتضی",
      "- تاکسی -- ۴۰۰٬۰۰۰ تومان",
      "  پرداخت‌کننده: سینا",
      "  تقسیم بین: سینا و حسام",
      "- بلیت -- ۶۰۰٬۰۰۰ تومان",
      "  پرداخت‌کننده: حسام",
      "  تقسیم بین: حسام و مرتضی",
      "",
      "سهم نهایی افراد:",
      "- سینا: ۵۰۰٬۰۰۰ تومان",
      "- حسام: ۸۰۰٬۰۰۰ تومان",
      "- مرتضی: ۶۰۰٬۰۰۰ تومان",
      "",
      "تسویه:",
      "مرتضی باید ۶۰۰٬۰۰۰ تومان به سینا پرداخت کند.",
      "حسام باید ۲۰۰٬۰۰۰ تومان به سینا پرداخت کند.",
    ].join("\n");
    expect(text).toBe(expected);
  });

  it("renders the settled message when no transfers are needed", () => {
    const list = [
      p("a", "آ", [expense("e1", "x", 100, "a", ["a", "b"])]),
      p("b", "ب", [expense("e2", "x", 100, "b", ["a", "b"])]),
    ];
    const result = settle(list);
    const text = buildShareText(result, "rial");
    expect(text).toContain("حساب همه تسویه است و نیازی به انتقال پول نیست.");
  });

  it("uses the requested currency label", () => {
    const list = [p("a", "آ", [expense("e1", "x", 500, "a", ["a", "b"])]), p("b", "ب")];
    const result = settle(list);
    const text = buildShareText(result, "aed");
    expect(text).toContain("درهم");
  });
});