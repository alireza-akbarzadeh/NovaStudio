"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { display } from "../landing/display-font";
import { GlowOrb } from "../landing/glow-orb";
import { LANDING } from "../landing/landing-colors";
import { DEMO_STEPS } from "./constants";
import { DemoAppMockup } from "./demo-app-mockup";
import { DemoControls } from "./demo-controls";
import { DemoHighlight } from "./demo-highlight";
import { DemoNarration } from "./demo-narration";
import { DemoStepChips } from "./demo-step-chips";
import { useDemoTour } from "./use-demo-tour";

export function DemoView() {
  const stageRef = useRef<HTMLDivElement>(null);
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
  } = useDemoTour();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#06070d] text-white antialiased">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(59,130,246,0.16),transparent)]" />
      <GlowOrb className="-left-20 top-10" color={LANDING.violet} size={420} />
      <GlowOrb
        className="-right-20 bottom-10"
        color={LANDING.blue}
        size={420}
        delay={3}
      />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#06070d]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt=""
              width={32}
              height={32}
              className="size-8"
              priority
            />
            <span
              className={cn(
                display.className,
                "text-[15px] font-semibold tracking-tight",
              )}
            >
              NovaStudio
            </span>
            <span className="ml-2 hidden rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/60 sm:inline">
              Product Tour
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col">
            <DemoNarration
              step={step}
              index={index}
              total={DEMO_STEPS.length}
            />
            <DemoControls
              index={index}
              playing={playing}
              isFinal={Boolean(step.isFinal)}
              onGoTo={goTo}
              onPrev={prev}
              onNext={advance}
              onRestart={restart}
              onTogglePlaying={togglePlaying}
            />
          </div>

          <div className="relative">
            <div ref={stageRef} className="relative aspect-[16/11] w-full">
              <DemoAppMockup activeStep={step} />
              <DemoHighlight
                containerRef={stageRef}
                region={step.region}
                color={step.color}
                pad={step.pad}
              />

              <div className="absolute -bottom-3 right-0 left-0 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: step.color }}
                  animate={{
                    width: step.isFinal ? "100%" : `${progress * 100}%`,
                  }}
                  transition={{ duration: 0.08, ease: "linear" }}
                />
              </div>
            </div>

            <DemoStepChips index={index} onGoTo={goTo} />
          </div>
        </div>
      </main>
    </div>
  );
}
