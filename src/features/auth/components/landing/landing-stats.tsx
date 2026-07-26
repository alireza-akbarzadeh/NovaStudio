"use client";

import { STATS } from "./constants";
import { Section } from "./landing-section";
import { useCountUp } from "./use-count-up";

function StatItem({
  v,
  suf,
  l,
  dec = 0,
}: {
  v: number;
  suf: string;
  l: string;
  dec?: number;
}) {
  const [val, ref] = useCountUp(v);
  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {val.toFixed(dec)}
        {suf}
      </div>
      <div className="mt-1 text-xs text-white/40">{l}</div>
    </div>
  );
}

export function LandingStats() {
  return (
    <Section className="py-12">
      <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md md:grid-cols-4 md:p-8">
        {STATS.map((s) => (
          <StatItem key={s.l} {...s} />
        ))}
      </div>
    </Section>
  );
}
