import Image from "next/image";

import { cn } from "@/lib/utils";

import { SHOWCASES } from "./constants";
import { display } from "./display-font";

export function LandingProductShowcases() {
  return (
    <section id="product" className="scroll-mt-24 border-t border-white/5">
      {SHOWCASES.map((item, index) => {
        const imageFirst = index % 2 === 1;
        return (
          <div
            key={item.id}
            className={cn(
              "border-b border-white/5 py-24 last:border-b-0 md:py-32",
              index % 2 === 1 && "bg-white/[0.01]",
            )}
          >
            <div
              className={cn(
                "mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 md:px-8",
              )}
            >
              <div className={cn(imageFirst && "md:order-2")}>
                <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
                  {item.eyebrow}
                </div>
                <h2
                  className={cn(
                    display.className,
                    "mb-5 text-3xl font-bold tracking-tight text-white md:text-4xl md:leading-[1.15]",
                  )}
                >
                  {item.title}
                </h2>
                <p className="mb-8 text-base leading-relaxed text-[#8b8e96] md:text-lg">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-[14px] text-[#bcbec4]"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ws-accent"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn("relative", imageFirst && "md:order-1")}>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-8 rounded-full bg-ws-accent/15 blur-[90px]"
                />
                <div
                  className="animate-float group relative overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0E] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.75)] transition-[border-color,box-shadow] duration-500 ease-out hover:border-white/15 hover:shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8)]"
                  style={{ animationDelay: `${index * 400}ms` }}
                >
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    width={1919}
                    height={1078}
                    className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                    sizes="(max-width: 768px) 100vw, 560px"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
