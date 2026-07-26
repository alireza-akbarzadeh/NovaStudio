"use client";

import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { FEATURES } from "./constants";
import { display } from "./display-font";
import { Section, SectionLabel } from "./landing-section";

export function LandingFeatures() {
  return (
    <Section id="features" className="scroll-mt-24 py-24">
      <div className="mb-12 text-center">
        <SectionLabel>Features</SectionLabel>
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
          Everything you need to ship
        </motion.h2>
        <p className="mx-auto mt-4 max-w-xl text-white/50">
          A complete platform built for speed, collaboration, and AI-first
          development.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-colors hover:border-white/20 sm:p-8"
          >
            <div
              className="absolute -top-20 -right-20 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30"
              style={{ background: f.color }}
            />
            <div className="relative">
              <div
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
                style={{ background: `${f.color}1a` }}
              >
                <f.icon className="h-5 w-5" style={{ color: f.color }} />
              </div>
              <h3 className="text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {f.desc}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {f.points.map((p) => (
                  <span
                    key={p}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/60"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
