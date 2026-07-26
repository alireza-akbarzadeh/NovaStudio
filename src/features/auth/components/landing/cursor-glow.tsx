"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

import { LANDING } from "./landing-colors";

export function CursorGlow() {
  const x = useMotionValue(-500);
  const y = useMotionValue(-500);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-[60] hidden h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] md:block"
      style={{
        left: sx,
        top: sy,
        background: `radial-gradient(circle, ${LANDING.blue}22, transparent 70%)`,
      }}
    />
  );
}
