import { cn } from "@/lib/utils";

import { FEATURES } from "./constants";
import { display } from "./display-font";

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-white/5 bg-white/[0.01] py-24"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            Features
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            Everything you need to ship in the browser.
          </h2>
          <p className="mt-5 text-balance text-base leading-relaxed text-[#8b8e96] md:text-lg">
            From the first file open to the last commit — AI, IDE, Git, and
            project hub in one workspace.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              id={feature.id}
              className="scroll-mt-24 bg-[#121316] p-8 transition-colors duration-300 ease-out hover:bg-white/[0.03] md:p-9"
            >
              <div className="mb-5 font-mono text-[10px] font-bold tracking-widest text-ws-accent-soft uppercase">
                {feature.label}
              </div>
              <h3 className="mb-3 text-lg font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-[#8b8e96]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
