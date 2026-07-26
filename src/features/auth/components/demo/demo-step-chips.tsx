"use client";

import { cn } from "@/lib/utils";

import { DEMO_STEPS } from "./constants";

type DemoStepChipsProps = {
  index: number;
  onGoTo: (index: number) => void;
};

export function DemoStepChips({ index, onGoTo }: DemoStepChipsProps) {
  return (
    <div className="mt-10 flex flex-wrap gap-2">
      {DEMO_STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onGoTo(i)}
            aria-current={i === index ? "step" : undefined}
            className={cn(
              "group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
              i === index
                ? "border-white/20 bg-white/[0.06]"
                : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
            )}
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: `${s.color}22` }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
            </span>
            <span className="text-xs font-medium text-white/80">{s.badge}</span>
          </button>
        );
      })}
    </div>
  );
}
