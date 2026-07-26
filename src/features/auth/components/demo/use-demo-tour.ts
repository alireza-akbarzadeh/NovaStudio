"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEMO_STEPS, STEP_MS } from "./constants";

export function useDemoTour() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const step = DEMO_STEPS[index]!;

  const goTo = useCallback((next: number) => {
    const len = DEMO_STEPS.length;
    setIndex(((next % len) + len) % len);
    setProgress(0);
  }, []);

  const advance = useCallback(() => {
    setIndex((cur) => {
      const current = DEMO_STEPS[cur];
      if (current?.isFinal) return cur;
      return Math.min(cur + 1, DEMO_STEPS.length - 1);
    });
    setProgress(0);
  }, []);

  const prev = useCallback(() => {
    setIndex((cur) => Math.max(cur - 1, 0));
    setProgress(0);
  }, []);

  const restart = useCallback(() => {
    setIndex(0);
    setProgress(0);
    setPlaying(true);
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  useEffect(() => {
    if (!playing || step.isFinal) {
      if (step.isFinal) setProgress(1);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min(1, (now - start) / STEP_MS);
      setProgress(pct);
      if (pct >= 1) {
        advance();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [index, playing, step.isFinal, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === " ") {
        e.preventDefault();
        if (!step.isFinal) togglePlaying();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, prev, step.isFinal, togglePlaying]);

  return {
    index,
    step,
    playing,
    progress,
    goTo,
    advance,
    prev,
    restart,
    togglePlaying,
    setPlaying,
  };
}
