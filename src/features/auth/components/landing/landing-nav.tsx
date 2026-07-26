"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AppUserButton } from "@/features/billing/components/app-user-button";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

import { NAV_LINKS } from "./constants";
import { display } from "./display-font";
import { PricingLink } from "./pricing-link";

export function LandingNav() {
  const { openProjects } = useProjectsDialog();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div
        className={cn(
          "flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
          scrolled
            ? "border border-white/10 bg-black/50 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            : "border border-transparent",
        )}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt=""
            width={32}
            height={32}
            className="size-8"
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

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((n) =>
            n.href === "#pricing" ? (
              <PricingLink
                key={n.href}
                className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </PricingLink>
            ) : (
              <a
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/projects">
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/projects">
              <Button
                size="sm"
                className="rounded-lg bg-white text-black hover:bg-white/90"
              >
                Start Free <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Button
              size="sm"
              onClick={() => openProjects()}
              className="rounded-lg bg-white text-black hover:bg-white/90"
            >
              Open projects
            </Button>
            <AppUserButton />
          </Show>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-white md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 right-4 left-4 z-50 rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((n) =>
                n.href === "#pricing" ? (
                  <PricingLink
                    key={n.href}
                    className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                    onClick={() => setOpen(false)}
                  >
                    {n.label}
                  </PricingLink>
                ) : (
                  <a
                    key={n.href}
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                  >
                    {n.label}
                  </a>
                ),
              )}
              <Show when="signed-out">
                <SignUpButton mode="modal" forceRedirectUrl="/projects">
                  <Button
                    size="sm"
                    className="mt-2 rounded-lg bg-white text-black"
                    onClick={() => setOpen(false)}
                  >
                    Start Free
                  </Button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Button
                  size="sm"
                  className="mt-2 rounded-lg bg-white text-black"
                  onClick={() => {
                    setOpen(false);
                    openProjects();
                  }}
                >
                  Open projects
                </Button>
              </Show>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
