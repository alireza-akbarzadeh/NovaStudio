"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

export function Section({ id, children, className }: SectionProps) {
  return (
    <section id={id} className={cn("relative w-full px-5 sm:px-8", className)}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

type SectionLabelProps = {
  children: ReactNode;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md"
    >
      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
      {children}
    </motion.div>
  );
}
