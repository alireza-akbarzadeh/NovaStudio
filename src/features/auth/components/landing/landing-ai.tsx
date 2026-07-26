"use client";

import { motion } from "motion/react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { Bot, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { AI_CARDS } from "./constants";
import { display } from "./display-font";
import { GlowOrb } from "./glow-orb";
import { LANDING } from "./landing-colors";
import { Section, SectionLabel } from "./landing-section";
import { PricingLink } from "./pricing-link";

export function LandingAi() {
  const { openProjects } = useProjectsDialog();

  return (
    <Section id="ai" className="scroll-mt-24 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-violet-500/[0.06] to-transparent p-8 backdrop-blur-md sm:p-14">
        <GlowOrb className="top-[-30%] left-[20%]" color={LANDING.violet} size={520} />
        <GlowOrb
          className="right-[10%] bottom-[-30%]"
          color={LANDING.blue}
          size={420}
          delay={2}
        />
        <div className="relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionLabel>Ask NovaStudio</SectionLabel>
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
              Meet{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
                NovaStudio AI
              </span>
            </motion.h2>
            <p className="mt-5 text-white/55">
              Ask NovaStudio lives inside your workspace with context from open
              files and the project tree. Generate code, explain logic, fix bugs,
              and draft docs — without leaving the editor.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Show when="signed-out">
                <SignUpButton mode="modal" forceRedirectUrl="/projects">
                  <Button className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-90">
                    <Bot className="mr-2 h-4 w-4" /> Try Ask NovaStudio
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button
                  onClick={() => openProjects()}
                  className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-90"
                >
                  <Bot className="mr-2 h-4 w-4" /> Open projects
                </Button>
              </Show>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <PricingLink>
                  <Play className="mr-2 h-4 w-4" /> View pricing
                </PricingLink>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {AI_CARDS.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md"
              >
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${c.c}1a` }}
                >
                  <c.icon className="h-4 w-4" style={{ color: c.c }} />
                </div>
                <div className="text-sm font-medium text-white">{c.title}</div>
                <div className="mt-1 text-xs text-white/40">{c.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
