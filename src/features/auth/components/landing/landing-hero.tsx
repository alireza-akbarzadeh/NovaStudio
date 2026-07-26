"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";

import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { PricingLink } from "./pricing-link";
import { WindowControls } from "./window-controls";

export function LandingHero() {
  const { openProjects } = useProjectsDialog();

  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-ws-accent/20 opacity-50 blur-[160px]"
      />

      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="animate-float">
          <p
            className={cn(
              display.className,
              "mb-6 text-[clamp(2.75rem,9vw,5.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-white",
            )}
          >
            NovaStudio
          </p>
          <h1 className="mx-auto mb-6 max-w-5xl text-balance text-3xl font-bold tracking-tight text-white md:mb-8 md:text-6xl md:leading-[1.05]">
            Ship code{" "}
            <span className="text-[#8b8e96]">at the speed of</span> thought.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-balance text-base font-medium leading-relaxed text-[#8b8e96] md:mb-12 md:text-xl">
            The AI workspace for building software. Editor, terminal, Git, and
            Ask NovaStudio — zero install, in the browser.
          </p>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3 md:mb-14">
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/projects">
                <button
                  type="button"
                  className="rounded-md bg-ws-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-ws-accent-hover"
                >
                  Start building
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/projects">
                <button
                  type="button"
                  className="rounded-md border border-white/10 bg-transparent px-5 py-2.5 text-[14px] text-[#bcbec4] transition-colors hover:border-white/20 hover:text-white"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <button
                type="button"
                onClick={() => openProjects()}
                className="rounded-md bg-ws-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-ws-accent-hover"
              >
                Open projects
              </button>
              <PricingLink className="rounded-md border border-white/10 bg-transparent px-5 py-2.5 text-[14px] text-[#bcbec4] transition-colors hover:border-white/20 hover:text-white">
                View pricing
              </PricingLink>
            </Show>
          </div>
        </div>

        <div
          className="animate-float relative mx-auto max-w-6xl"
          style={{ animationDelay: "200ms" }}
        >
          <div
            aria-hidden
            className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-white/15 to-transparent opacity-10 blur-sm"
          />
          <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0E] shadow-[0_48px_100px_-20px_rgba(0,0,0,0.8)] transition-[border-color,box-shadow] duration-500 ease-out hover:border-white/15 hover:shadow-[0_56px_110px_-20px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-3 md:px-5">
              <WindowControls />
              <div className="font-mono text-[10px] tracking-widest text-[#9a9a9a] uppercase opacity-60 md:text-[11px]">
                workspace — NovaStudio
              </div>
              <div className="flex w-20 justify-end md:w-24">
                <div className="size-3.5 rounded-sm bg-white/10 md:size-4" />
              </div>
            </div>
            <Image
              src="/code.png"
              alt="NovaStudio AI workspace with code editor, terminal, and Ask NovaStudio assistant"
              width={1919}
              height={1076}
              priority
              className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
