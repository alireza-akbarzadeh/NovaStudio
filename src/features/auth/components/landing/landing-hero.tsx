"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Check, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { GlowOrb } from "./glow-orb";
import { LANDING } from "./landing-colors";
import { LandingHeroEditor } from "./landing-hero-editor";
import { Section } from "./landing-section";
import { PricingLink } from "./pricing-link";

export function LandingHero() {
  const { openProjects } = useProjectsDialog();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div id="top" ref={ref} className="relative overflow-hidden pt-32 sm:pt-40">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#06070d]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
        <GlowOrb className="top-[10%] left-[-10%]" color={LANDING.violet} size={560} />
        <GlowOrb
          className="top-[30%] right-[-10%]"
          color={LANDING.blue}
          size={560}
          delay={3}
        />
        <GlowOrb
          className="top-[55%] left-[40%]"
          color={LANDING.cyan}
          size={420}
          delay={6}
        />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <motion.div style={{ y, opacity }} className="relative">
        <Section className="pb-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            Ask NovaStudio — AI in your workspace
            <ArrowRight className="h-3 w-3" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className={cn(
              display.className,
              "mb-4 text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.95] font-extrabold tracking-[-0.04em] text-white",
            )}
          >
            NovaStudio
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="mx-auto max-w-4xl text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Build Software Together.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-base text-white/55 sm:text-lg"
          >
            The AI workspace for building software. Editor, terminal, Git, and
            Ask NovaStudio — collaborate live and ship from the browser.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/projects">
                <Button
                  size="lg"
                  className="group h-12 rounded-xl bg-white px-6 text-black hover:bg-white/90"
                >
                  Start Building Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/projects">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-white/15 bg-white/5 px-6 text-white backdrop-blur-md hover:bg-white/10"
                >
                  <Play className="mr-2 h-4 w-4" /> Sign in
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Button
                size="lg"
                onClick={() => openProjects()}
                className="group h-12 rounded-xl bg-white px-6 text-black hover:bg-white/90"
              >
                Open projects
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/15 bg-white/5 px-6 text-white backdrop-blur-md hover:bg-white/10"
              >
                <PricingLink>View pricing</PricingLink>
              </Button>
            </Show>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 flex items-center justify-center gap-6 text-xs text-white/40"
          >
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Zero install
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Browser workspace
            </span>
          </motion.div>
        </Section>

        <Section className="pb-24">
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto max-w-5xl"
          >
            <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-[2rem] bg-gradient-to-b from-blue-500/20 via-violet-500/10 to-transparent blur-2xl" />
            <LandingHeroEditor />
          </motion.div>
        </Section>
      </motion.div>
    </div>
  );
}
