"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { motion } from "motion/react";

import type { DemoRegionId } from "./constants";

type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type DemoHighlightProps = {
  containerRef: RefObject<HTMLElement | null>;
  region: DemoRegionId;
  color: string;
  pad?: number;
};

function measureRegion(
  container: HTMLElement,
  region: DemoRegionId,
  pad: number,
): Rect | null {
  const el = container.querySelector<HTMLElement>(
    `[data-demo-region="${region}"]`,
  );
  if (!el) return null;

  const c = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;

  const left = Math.max(0, r.left - c.left - pad);
  const top = Math.max(0, r.top - c.top - pad);
  const right = Math.min(c.width, r.right - c.left + pad);
  const bottom = Math.min(c.height, r.bottom - c.top + pad);

  return {
    left,
    top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

function radiusForRegion(region: DemoRegionId) {
  switch (region) {
    case "frame":
      return 16;
    case "collab":
      return 999;
    case "workspace":
      return 10;
    default:
      return 12;
  }
}

export function DemoHighlight({
  containerRef,
  region,
  color,
  pad = 4,
}: DemoHighlightProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      setRect(measureRegion(container, region, pad));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(container);
    const target = container.querySelector(`[data-demo-region="${region}"]`);
    if (target) ro.observe(target);

    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef, region, pad]);

  if (!rect) return null;

  const radius = radiusForRegion(region);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden overflow-hidden rounded-2xl sm:block">
      <motion.div
        initial={false}
        animate={{
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          opacity: 1,
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="absolute border-2"
        style={{
          borderRadius: radius,
          borderColor: color,
          boxShadow: `0 0 0 9999px rgba(6,7,13,0.52), 0 0 28px ${color}88`,
        }}
      >
        <span
          className="absolute -top-1.5 -left-1.5 h-3 w-3 animate-ping rounded-full opacity-50"
          style={{ background: color }}
        />
        <span
          className="absolute -top-1 -left-1 h-2 w-2 rounded-full ring-2 ring-[#06070d]"
          style={{ background: color }}
        />
      </motion.div>
    </div>
  );
}
