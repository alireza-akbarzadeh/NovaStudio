"use client";

import { motion } from "motion/react";

import { LANDING } from "./landing-colors";

type GlowOrbProps = {
  className?: string;
  color?: string;
  size?: number;
  delay?: number;
};

export function GlowOrb({
  className,
  color = LANDING.violet,
  size = 520,
  delay = 0,
}: GlowOrbProps) {
  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className ?? ""}`}
      style={{ width: size, height: size, background: color, opacity: 0.22 }}
      animate={{
        x: [0, 30, -20, 0],
        y: [0, -25, 15, 0],
        scale: [1, 1.08, 0.96, 1],
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}
