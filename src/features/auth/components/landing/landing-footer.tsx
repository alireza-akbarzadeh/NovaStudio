"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import Image from "next/image";

import { useProjectsDialog } from "@/features/projects/components/projects-dialog";

import { PricingLink } from "./pricing-link";

export function LandingFooter() {
  const { openProjects } = useProjectsDialog();

  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 px-6 md:flex-row md:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 opacity-50"
          />
          <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-40">
            NovaStudio {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex gap-10 font-mono text-[10px] font-bold tracking-widest text-[#9a9a9a] uppercase">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#roadmap" className="transition-colors hover:text-white">
            Roadmap
          </a>
          <PricingLink className="transition-colors hover:text-white">
            Pricing
          </PricingLink>
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/projects">
              <button
                type="button"
                className="transition-colors hover:text-white"
              >
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <button
              type="button"
              onClick={() => openProjects()}
              className="transition-colors hover:text-white"
            >
              Projects
            </button>
          </Show>
        </div>
        <div className="font-mono text-[10px] tracking-widest text-[#9a9a9a]/30 uppercase">
          Designed for precision engineering
        </div>
      </div>
    </footer>
  );
}
