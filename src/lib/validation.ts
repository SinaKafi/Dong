import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1, "عنوان هزینه نمی‌تواند خالی باشد."),
  amount: z
    .number()
    .finite("مبلغ باید عدد معتبر باشد.")
    .int("مبلغ باید عدد صحیح باشد.")
    .positive("مبلغ باید بزرگ‌تر از صفر باشد."),
  paidByParticipantId: z.string(),
  includedParticipantIds: z.array(z.string()).min(1, "حداقل یک نفر را برای تقسیم این هزینه انتخاب کنید."),
});

export const participantSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "نام نمی‌تواند خالی باشد."),
  expenses: z.array(expenseSchema),
});

export const currencySchema = z.enum(["toman", "rial", "aed"]);

export const appStateSchema = z.object({
  participants: z.array(participantSchema),
  currency: currencySchema,
});

/** Names (trimmed, case-sensitive) must be unique. Returns the first duplicate or null. */
export function findDuplicateName(names: string[]): string | null {
  const seen = new Set<string>();
  for (const n of names) {
    const key = n.trim();
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return null;
}

export const MIN_PARTICIPANTS = 2;
