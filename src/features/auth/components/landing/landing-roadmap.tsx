import { cn } from "@/lib/utils";

import { COMING_SOON } from "./constants";
import { display } from "./display-font";

export function LandingRoadmap() {
  return (
    <section
      id="roadmap"
      className="scroll-mt-24 border-t border-white/5 bg-white/[0.01] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            Coming soon
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            More on the way.
          </h2>
          <p className="mt-5 text-balance text-base leading-relaxed text-[#8b8e96] md:text-lg">
            We&apos;re building the next layer of NovaStudio — collaboration,
            deploy, and agents that meet you where you already work.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              className="group relative border border-white/5 bg-[#121316]/80 p-6 transition-[border-color,background-color,transform] duration-300 ease-out hover:-translate-y-0.5 hover:border-white/10 hover:bg-[#121316] md:p-7"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-bold text-white">
                  {item.label}
                </h3>
                <span className="shrink-0 rounded-sm border border-ws-accent/30 bg-ws-accent/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-ws-accent-soft uppercase">
                  Soon
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-[#8b8e96]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
