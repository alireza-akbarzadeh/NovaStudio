/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DEMO_STEPS, STEP_MS } from "./constants";

type UseDemoTourOptions = {
  /** When false, arrow/space shortcuts are disabled (landing embed). */
  enableKeyboard?: boolean;
  /** When false, autoplay is paused (e.g. off-screen). */
  active?: boolean;
  /** Loop back to the first step after the finale. */
  loop?: boolean;
};

export function useDemoTour({
  enableKeyboard = true,
  active = true,
  loop = false,
}: UseDemoTourOptions = {}) {
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
      if (current?.isFinal) {
        return loop ? 0 : cur;
      }
      return Math.min(cur + 1, DEMO_STEPS.length - 1);
    });
    setProgress(0);
  }, [loop]);

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
    if (!active || !playing || (step.isFinal && !loop)) {
      if (step.isFinal && !loop) setProgress(1);
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
  }, [index, playing, step.isFinal, advance, active, loop]);

  useEffect(() => {
    if (!enableKeyboard) return;

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
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
        if (!step.isFinal || loop) togglePlaying();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, prev, step.isFinal, togglePlaying, enableKeyboard, loop]);

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
