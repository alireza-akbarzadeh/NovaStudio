"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { FAQS } from "./constants";
import { display } from "./display-font";
import { Section, SectionLabel } from "./landing-section";

function FaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: (typeof FAQS)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-white">{item.q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-white/55">
              {item.a}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LandingFaq() {
  const [open, setOpen] = useState(0);

  return (
    <Section id="faq" className="scroll-mt-24 py-24">
      <div className="mb-12 text-center">
        <SectionLabel>FAQ</SectionLabel>
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
          Frequently asked questions
        </motion.h2>
      </div>
      <div className="mx-auto max-w-3xl space-y-3">
        {FAQS.map((f, i) => (
          <FaqItem
            key={f.q}
            item={f}
            isOpen={open === i}
            onToggle={() => setOpen(open === i ? -1 : i)}
          />
        ))}
      </div>
    </Section>
  );
}
