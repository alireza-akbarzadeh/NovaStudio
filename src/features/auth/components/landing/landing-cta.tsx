"use client";

import { motion } from "motion/react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { GlowOrb } from "./glow-orb";
import { LANDING } from "./landing-colors";
import { Section } from "./landing-section";
import { PricingLink } from "./pricing-link";

export function LandingCta() {
  const { openProjects } = useProjectsDialog();

  return (
    <Section className="py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.12] via-violet-500/[0.08] to-cyan-500/[0.05] p-10 text-center backdrop-blur-md sm:p-16"
      >
        <GlowOrb className="top-[-30%] left-[10%]" color={LANDING.violet} size={520} />
        <GlowOrb
          className="right-[5%] bottom-[-30%]"
          color={LANDING.blue}
          size={460}
          delay={2}
        />
        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn(
              display.className,
              "text-3xl font-semibold tracking-tight text-white sm:text-5xl",
            )}
          >
            Build the Future Together
          </motion.h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">
            Create a free account, open a workspace, and start editing with AI,
            Git, and terminal — then invite your team.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/projects">
                <Button
                  size="lg"
                  className="group h-12 rounded-xl bg-white px-6 text-black hover:bg-white/90"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </SignUpButton>
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
            </Show>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-white/15 bg-white/5 px-6 text-white backdrop-blur-md hover:bg-white/10"
            >
              <PricingLink>
                <Play className="mr-2 h-4 w-4" /> View pricing
              </PricingLink>
            </Button>
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
