"use client";

import { Show, SignUpButton } from "@clerk/nextjs";

import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { PricingLink } from "./pricing-link";

export function LandingCta() {
  const { openProjects } = useProjectsDialog();

  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-10 text-center transition-[border-color,box-shadow] duration-500 ease-out hover:border-white/10 hover:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.6)] md:rounded-[40px] md:p-16">
          <div
            aria-hidden
            className="absolute -top-24 -left-24 size-64 rounded-full bg-ws-accent/15 blur-[100px]"
          />
          <h2
            className={cn(
              display.className,
              "relative mb-6 text-3xl font-bold text-white md:text-4xl",
            )}
          >
            Build for the next era.
          </h2>
          <p className="relative mb-10 text-balance text-base text-[#8b8e96] md:text-lg">
            Create a free account, open a workspace, and start editing with AI,
            Git, and terminal — then grow into what&apos;s coming next.
          </p>

          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/projects">
                <button
                  type="button"
                  className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#121316] transition-all hover:bg-zinc-200"
                >
                  Create account
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <button
                type="button"
                onClick={() => openProjects()}
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#121316] transition-all hover:bg-zinc-200"
              >
                Open projects
              </button>
            </Show>
            <PricingLink className="rounded-xl border border-white/10 px-8 py-3.5 text-sm font-medium text-[#bcbec4] transition-colors hover:border-white/20 hover:text-white">
              View pricing
            </PricingLink>
          </div>
          <p className="relative mt-8 font-mono text-[11px] tracking-[0.2em] text-[#9a9a9a]/40 uppercase">
            Browser workspace / AI + Git + terminal
          </p>
        </div>
      </div>
    </section>
  );
}
