"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { DEMO_STEPS } from "../demo/constants";
import { DemoAppMockup } from "../demo/demo-app-mockup";
import { DemoHighlight } from "../demo/demo-highlight";
import { useDemoTour } from "../demo/use-demo-tour";
import { display } from "./display-font";

export function LandingHeroEditor() {
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const {
    index,
    step,
    playing,
    progress,
    goTo,
    advance,
    prev,
    restart,
    togglePlaying,
  } = useDemoTour({
    enableKeyboard: false,
    active: inView,
    loop: true,
  });

  const Icon = step.icon;

  return (
    <div ref={rootRef} id="demo" className="scroll-mt-28">
      <div className="relative mx-auto max-w-5xl">
        <div
          ref={stageRef}
          className="relative aspect-[16/11] w-full min-h-[320px]"
        >
          <DemoAppMockup activeStep={step} />
          <DemoHighlight
            containerRef={stageRef}
            region={step.region}
            color={step.color}
            pad={step.pad}
          />

          <div className="absolute right-0 bottom-0 left-0 h-1 overflow-hidden rounded-b-2xl bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ background: step.color }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.08, ease: "linear" }}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md"
                style={{ background: `${step.color}22` }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: step.color }} />
              </span>
              <span className="text-xs font-medium tracking-wide text-white/40 uppercase">
                {step.badge}
              </span>
              <span className="text-xs text-white/30">
                {index + 1} / {DEMO_STEPS.length}
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                <h2
                  className={cn(
                    display.className,
                    "text-lg font-semibold tracking-tight text-white sm:text-xl",
                  )}
                >
                  {step.title}
                </h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-white/50">
                  {step.desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={restart}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
              aria-label="Restart tour"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors enabled:hover:bg-white/10 disabled:opacity-30"
              aria-label="Previous step"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={togglePlaying}
              className="flex h-9 w-14 items-center justify-center rounded-lg bg-white text-black transition-colors hover:bg-white/90"
              aria-label={playing ? "Pause tour" : "Play tour"}
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={advance}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10"
              aria-label="Next step"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {DEMO_STEPS.map((s, i) => {
            const StepIcon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "group flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all",
                  i === index
                    ? "border-white/20 bg-white/[0.06]"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]",
                )}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: `${s.color}22` }}
                >
                  <StepIcon
                    className="h-3 w-3"
                    style={{ color: s.color }}
                  />
                </span>
                <span className="text-[11px] font-medium text-white/75">
                  {s.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
