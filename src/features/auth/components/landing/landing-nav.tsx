"use client";

import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { AppUserButton } from "@/features/billing/components/app-user-button";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { PricingLink } from "./pricing-link";

export function LandingNav() {
  const { openProjects } = useProjectsDialog();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#121316]/80 px-6 py-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-10">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt=""
            width={24}
            height={24}
            className="size-6"
            priority
          />
          <span
            className={cn(
              display.className,
              "text-[15px] font-semibold tracking-tight text-white",
            )}
          >
            NovaStudio
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-[13px] font-medium text-[#9a9a9a] md:flex">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#product" className="transition-colors hover:text-white">
            Product
          </a>
          <a href="#roadmap" className="transition-colors hover:text-white">
            Roadmap
          </a>
          <a href="#workflow" className="transition-colors hover:text-white">
            Workflow
          </a>
          <PricingLink className="transition-colors hover:text-white">
            Pricing
          </PricingLink>
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6">
        <Show when="signed-out">
          <SignInButton mode="modal" forceRedirectUrl="/projects">
            <button
              type="button"
              className="text-[13px] font-medium text-[#9a9a9a] transition-colors hover:text-white"
            >
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal" forceRedirectUrl="/projects">
            <button
              type="button"
              className="rounded-md bg-white px-4 py-2 text-[13px] font-bold text-[#121316] transition-colors hover:bg-zinc-200 sm:px-5"
            >
              Get started
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <button
            type="button"
            onClick={() => openProjects()}
            className="rounded-md bg-white px-4 py-2 text-[13px] font-bold text-[#121316] transition-colors hover:bg-zinc-200 sm:px-5"
          >
            Open projects
          </button>
          <AppUserButton />
        </Show>
      </div>
    </nav>
  );
}
