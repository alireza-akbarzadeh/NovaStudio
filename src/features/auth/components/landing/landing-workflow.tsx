import { cn } from "@/lib/utils";

import { WORKFLOW_STEPS } from "./constants";
import { display } from "./display-font";

export function LandingWorkflow() {
  return (
    <section
      id="workflow"
      className="scroll-mt-24 border-t border-white/5 bg-white/[0.01] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            Workflow
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            Four steps. Zero context switching.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 md:grid-cols-4">
          {WORKFLOW_STEPS.map((s) => (
            <div
              key={s.n}
              className="group relative bg-[#121316] p-8 transition-colors duration-300 ease-out hover:bg-white/[0.03]"
            >
              <div className="mb-8 font-mono text-[42px] leading-none font-bold text-white/10 transition-colors duration-300 group-hover:text-ws-accent/40">
                {s.n}
              </div>
              <h3 className="mb-3 text-lg font-bold text-white">{s.t}</h3>
              <p className="text-[13px] leading-relaxed text-[#8b8e96]">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
