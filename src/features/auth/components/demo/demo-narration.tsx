"use client";

import { AnimatePresence, motion } from "motion/react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "../landing/display-font";
import type { DemoStep } from "./constants";

type DemoNarrationProps = {
  step: DemoStep;
  index: number;
  total: number;
};

export function DemoNarration({ step, index, total }: DemoNarrationProps) {
  const { openProjects } = useProjectsDialog();
  const Icon = step.icon;

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: `${step.color}22` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: step.color }} />
        </span>
        <span className="text-xs font-medium tracking-wide text-white/40 uppercase">
          {step.badge}
        </span>
        <span className="ml-auto text-xs text-white/30">
          {index + 1} / {total}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
        >
          <h1
            className={cn(
              display.className,
              "text-2xl leading-tight font-semibold tracking-tight sm:text-3xl",
            )}
          >
            {step.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/55">
            {step.desc}
          </p>

          {step.isFinal ? (
            <div className="mt-6 flex flex-col gap-2.5">
              <Show when="signed-out">
                <SignUpButton mode="modal" forceRedirectUrl="/projects">
                  <Button
                    size="lg"
                    className="h-11 w-full rounded-xl bg-white text-black hover:bg-white/90"
                  >
                    Start Building Free{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button
                  size="lg"
                  onClick={() => openProjects()}
                  className="h-11 w-full rounded-xl bg-white text-black hover:bg-white/90"
                >
                  Open projects <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Show>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 w-full rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/">Back to overview</Link>
              </Button>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
