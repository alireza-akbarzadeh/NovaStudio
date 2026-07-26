"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

import { TESTIMONIALS } from "./constants";
import { display } from "./display-font";
import { Section, SectionLabel } from "./landing-section";

export function LandingTestimonials() {
  return (
    <Section className="py-24">
      <div className="mb-12 text-center">
        <SectionLabel>Loved by builders</SectionLabel>
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
          What builders say
        </motion.h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.n}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
            whileHover={{ y: -4 }}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
          >
            <div className="mb-3 flex gap-0.5">
              {[...Array(5)].map((_, j) => (
                <Star
                  key={j}
                  className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="flex-1 text-sm leading-relaxed text-white/70">
              &ldquo;{t.q}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.c} text-xs font-semibold text-white`}
              >
                {t.n
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{t.n}</div>
                <div className="text-xs text-white/40">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
