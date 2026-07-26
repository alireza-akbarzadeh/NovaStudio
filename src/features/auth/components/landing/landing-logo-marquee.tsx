"use client";

import { motion } from "motion/react";

import { LOGOS } from "./constants";
import { Section } from "./landing-section";

export function LandingLogoMarquee() {
  return (
    <Section className="py-16">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-8 text-center text-xs tracking-[0.2em] text-white/30 uppercase"
      >
        Built into the tools you already use
      </motion.p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <motion.div
          className="flex w-max gap-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {[...LOGOS, ...LOGOS].map((l, i) => (
            <div key={`${l.n}-${i}`} className="flex items-center gap-2 text-white/40">
              <l.Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{l.n}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}
