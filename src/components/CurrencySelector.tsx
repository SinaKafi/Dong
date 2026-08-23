"use client";

import { CURRENCIES } from "@/lib/types";
import type { CurrencyCode } from "@/lib/types";

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-white/70">واحد پول</span>
      <div
        role="radiogroup"
        aria-label="انتخاب واحد پول"
        className="grid grid-cols-3 gap-2"
      >
        {CURRENCIES.map((c) => {
          const active = c.code === value;
          return (
            <button
              key={c.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(c.code)}
              className={[
                "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                "backdrop-blur-md touch-manipulation",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                active
                  ? "border-white/40 bg-white/25 text-white shadow-lg shadow-black/10"
                  : "border-white/15 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90",
              ].join(" ")}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
