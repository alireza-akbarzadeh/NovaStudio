"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";

import { cn } from "@/lib/utils";

import { WORKFLOW_STEPS } from "./constants";
import { display } from "./display-font";
import { Section, SectionLabel } from "./landing-section";

export function LandingWorkflow() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const lineScale = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });

  return (
    <Section id="workflow" className="scroll-mt-24 py-24">
      <div className="mb-12 text-center">
        <SectionLabel>Workflow</SectionLabel>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn(
            display.className,
            "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl",
          )}
        >
          From idea to deploy
        </motion.h2>
      </div>
      <div ref={ref} className="relative">
        <div className="absolute top-0 left-1/2 hidden h-full w-px -translate-x-1/2 bg-white/10 lg:block" />
        <motion.div
          className="absolute top-0 left-1/2 hidden h-full w-px origin-top -translate-x-1/2 bg-gradient-to-b from-blue-400 via-violet-400 to-cyan-400 lg:block"
          style={{ scaleY: lineScale }}
        />
        <div className="space-y-6 lg:space-y-0">
          {WORKFLOW_STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className={`relative flex items-center lg:py-6 ${
                i % 2 === 0 ? "lg:justify-start" : "lg:justify-end"
              }`}
            >
              <div
                className={`w-full lg:w-[44%] ${i % 2 === 0 ? "" : "lg:text-right"}`}
              >
                <div className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/20">
                  <div
                    className={`flex items-center gap-3 ${
                      i % 2 === 0 ? "" : "lg:flex-row-reverse"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20">
                      <s.icon className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className={i % 2 === 0 ? "" : "lg:text-right"}>
                      <span className="text-xs text-white/30">{s.n}</span>
                      <h3 className="text-base font-semibold text-white">
                        {s.title}
                      </h3>
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-sm text-white/50 ${
                      i % 2 === 0 ? "" : "lg:ml-auto lg:max-w-[80%]"
                    }`}
                  >
                    {s.desc}
                  </p>
                </div>
              </div>
              <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
                <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-cyan-400 bg-[#06070d]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}
