"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { AtSign, Globe, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { Section } from "./landing-section";
import { PricingLink } from "./pricing-link";

const FOOTER_COLS = [
  {
    h: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Workflow", href: "#workflow" },
    ],
  },
  {
    h: "Resources",
    links: [
      { label: "AI", href: "#ai" },
      { label: "Collaboration", href: "#collab" },
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" },
      { label: "Community", href: "/#community" },
      { label: "Product tour", href: "/#demo" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "/contact" },
      { label: "Waitlist", href: "/waitlist" },
    ],
  },
  {
    h: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
] as const;

const SOCIALS = [Share2, Globe, AtSign, MessageCircle] as const;

export function LandingFooter() {
  const { openProjects } = useProjectsDialog();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-[#06070d]">
      <Section className="py-16">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt=""
                width={32}
                height={32}
                className="size-8"
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
            <p className="mt-4 max-w-xs text-sm text-white/40">
              The AI-powered cloud development platform where teams build
              software together in the browser.
            </p>
            <div className="mt-5 flex gap-2">
              {SOCIALS.map((S, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Social link"
                >
                  <S className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.h}>
              <h4 className="mb-3 text-xs font-medium tracking-wide text-white/40 uppercase">
                {col.h}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href === "#pricing" ? (
                      <PricingLink className="text-sm text-white/60 transition-colors hover:text-white">
                        {l.label}
                      </PricingLink>
                    ) : l.href.startsWith("/") ? (
                      <Link
                        href={l.href}
                        className="text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        className="text-sm text-white/60 transition-colors hover:text-white"
                      >
                        {l.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/30">
            © {year} NovaStudio. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
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
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All
              systems operational
            </span>
          </div>
        </div>
      </Section>
    </footer>
  );
}
