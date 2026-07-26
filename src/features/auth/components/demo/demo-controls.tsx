"use client";

import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import { DEMO_STEPS } from "./constants";

type DemoControlsProps = {
  index: number;
  playing: boolean;
  isFinal: boolean;
  onGoTo: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onTogglePlaying: () => void;
};

export function DemoControls({
  index,
  playing,
  isFinal,
  onGoTo,
  onPrev,
  onNext,
  onRestart,
  onTogglePlaying,
}: DemoControlsProps) {
  return (
    <div className="mt-auto pt-8">
      <div className="mb-3 flex gap-1.5">
        {DEMO_STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onGoTo(i)}
            aria-label={`Go to step ${i + 1}`}
            aria-current={i === index ? "step" : undefined}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i === index
                ? "bg-white"
                : i < index
                  ? "bg-white/40"
                  : "bg-white/15"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
          aria-label="Restart"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={index === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors enabled:hover:bg-white/10 disabled:opacity-30"
          aria-label="Previous"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onTogglePlaying}
          disabled={isFinal}
          className="flex h-9 w-14 items-center justify-center rounded-lg bg-white text-black transition-colors hover:bg-white/90 disabled:opacity-40"
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isFinal}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors enabled:hover:bg-white/10 disabled:opacity-30"
          aria-label="Next"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <span className="ml-auto hidden text-xs text-white/30 sm:inline">
          ← → keys · space to play
        </span>
      </div>
    </div>
  );
}
