"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  BookOpen,
  Rocket,
  Bot,
  Users,
  Cloud,
  Code2,
  Terminal,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CursorGlow } from "@/features/auth/components/landing/cursor-glow";
import { display } from "@/features/auth/components/landing/display-font";
import { GlowOrb } from "@/features/auth/components/landing/glow-orb";
import { LANDING } from "@/features/auth/components/landing/landing-colors";
import { LandingFooter } from "@/features/auth/components/landing/landing-footer";
import { LandingNav } from "@/features/auth/components/landing/landing-nav";
import {
  Section,
  SectionLabel,
} from "@/features/auth/components/landing/landing-section";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    icon: Rocket,
    color: LANDING.blue,
    name: "Getting Started",
    items: [
      "Quickstart",
      "Installation",
      "Your first workspace",
      "Invite your team",
    ],
  },
  {
    icon: Cloud,
    color: LANDING.cyan,
    name: "Core Concepts",
    items: [
      "Workspaces",
      "The editor",
      "Cloud environments",
      "Git integration",
    ],
  },
  {
    icon: Bot,
    color: LANDING.violet,
    name: "Nova AI",
    items: [
      "Code generation",
      "Code review",
      "Test generation",
      "Custom prompts",
    ],
  },
  {
    icon: Users,
    color: LANDING.blue,
    name: "Collaboration",
    items: ["Live cursors", "Comments", "Voice calls", "Version history"],
  },
  {
    icon: Code2,
    color: LANDING.emerald,
    name: "Development",
    items: [
      "Extensions",
      "Themes",
      "Command palette",
      "Keyboard shortcuts",
    ],
  },
  {
    icon: Terminal,
    color: LANDING.cyan,
    name: "Deployment",
    items: [
      "One-click deploy",
      "Custom domains",
      "Logs & metrics",
      "Rollbacks",
    ],
  },
] as const;

const QUICK = [
  {
    t: "Create your first workspace",
    d: "Spin up a cloud environment and open the IDE in under 60 seconds.",
    time: "5 min read",
  },
  {
    t: "Pair-program with Nova AI",
    d: "Generate, refactor, and review code with full repository context.",
    time: "7 min read",
  },
  {
    t: "Invite your team",
    d: "Share a link and start coding together with live cursors instantly.",
    time: "4 min read",
  },
  {
    t: "Deploy to production",
    d: "Ship from the editor to a live URL in one click with zero config.",
    time: "6 min read",
  },
] as const;

const POPULAR = [
  {
    t: "Understanding Nova AI context",
    c: "Nova AI",
    d: "How the assistant reads your whole codebase to suggest accurate fixes.",
  },
  {
    t: "Setting up custom domains",
    c: "Deployment",
    d: "Connect your domain and ship with automatic HTTPS in minutes.",
  },
  {
    t: "Writing effective prompts",
    c: "Nova AI",
    d: "Patterns for getting the best code, tests, and docs from Nova AI.",
  },
  {
    t: "Shared terminal sessions",
    c: "Collaboration",
    d: "Let teammates run commands together in a live, shared terminal.",
  },
  {
    t: "Extensions & themes",
    c: "Development",
    d: "Customize the editor with extensions, themes, and the command palette.",
  },
  {
    t: "Git & pull requests",
    c: "Core Concepts",
    d: "Branch, commit, review, and merge without leaving the workspace.",
  },
] as const;

export function DocsView() {
  const [q, setQ] = useState("");

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#06070d] font-sans text-white antialiased selection:bg-ws-accent/30 selection:text-white">
      <CursorGlow />
      <LandingNav />
      <GlowOrb className="left-[-10%] top-[5%]" color={LANDING.violet} size={520} />
      <GlowOrb
        className="right-[-10%] top-[25%]"
        color={LANDING.blue}
        size={460}
        delay={3}
      />

      <main>
        <Section className="pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Documentation</SectionLabel>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                display.className,
                "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl",
              )}
            >
              Build with{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                NovaStudio
              </span>
            </motion.h1>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Everything you need to spin up workspaces, collaborate live, ship
              with Nova AI, and deploy in one click.
            </p>
            <div className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-md focus-within:border-white/20">
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the docs..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                aria-label="Search the docs"
              />
              <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/40 sm:block">
                ⌘K
              </kbd>
            </div>
          </div>
        </Section>

        <Section className="py-16">
          <div className="mb-8 flex items-center gap-2">
            <Rocket className="h-4 w-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Quick start</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK.map((k, i) => (
              <motion.div
                key={k.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/20"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-sm font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="text-sm font-medium text-white">{k.t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                  {k.d}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-white/30">{k.time}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

        <Section className="py-10 pb-24">
          <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium tracking-wide text-white/40 uppercase">
                  <BookOpen className="h-3.5 w-3.5" /> Browse docs
                </div>
                <div className="space-y-1">
                  {SECTIONS.map((s) => (
                    <div key={s.name} className="rounded-lg px-2 py-1.5">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <s.icon
                          className="h-3.5 w-3.5 shrink-0"
                          style={{ color: s.color }}
                        />{" "}
                        {s.name}
                      </div>
                      <div className="mt-1 ml-5 space-y-0.5">
                        {s.items.map((it) => (
                          <div
                            key={it}
                            className="flex items-center gap-1 rounded px-1 py-1 text-xs text-white/50 transition-colors hover:text-white"
                          >
                            <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />{" "}
                            {it}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div>
              <h2 className="mb-6 text-lg font-semibold text-white">
                Popular articles
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {POPULAR.map((p, i) => (
                  <motion.div
                    key={p.t}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
                    whileHover={{ y: -4 }}
                    className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/20"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                        {p.c}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                    </div>
                    <h3 className="text-sm font-medium text-white">{p.t}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                      {p.d}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.1] to-violet-500/[0.06] p-6 backdrop-blur-md sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-base font-medium text-white">
                    Can&apos;t find what you need?
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    Our team and community are ready to help.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/contact">
                    <Button className="rounded-xl bg-white text-black hover:bg-white/90">
                      Contact support{" "}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/blog">
                    <Button
                      variant="outline"
                      className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                    >
                      Read the blog
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <LandingFooter />
    </div>
  );
}
