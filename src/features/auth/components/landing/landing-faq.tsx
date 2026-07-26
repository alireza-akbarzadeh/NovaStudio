import { cn } from "@/lib/utils";

import { FAQS } from "./constants";
import { display } from "./display-font";

export function LandingFaq() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            FAQ
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            Answers, before you ask.
          </h2>
        </div>
        <div className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-zinc-900/30">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer items-center justify-between text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="ml-4 font-mono text-lg text-[#9a9a9a] transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-relaxed text-[#8b8e96]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
