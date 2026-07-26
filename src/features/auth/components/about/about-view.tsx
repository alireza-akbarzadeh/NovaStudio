"use client";

import {
  ArrowRight,
  Heart,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
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

const STATS = [
  { v: "120K+", l: "Developers" },
  { v: "8M+", l: "Deploys / month" },
  { v: "99.99%", l: "Uptime" },
  { v: "4.9/5", l: "Avg. rating" },
];

const VALUES = [
  {
    icon: Users,
    c: LANDING.blue,
    t: "Builders first",
    d: "Every decision starts with what makes developers faster, happier, and more creative.",
  },
  {
    icon: Zap,
    c: LANDING.cyan,
    t: "Speed is a feature",
    d: "From editor input to deploy, we obsess over milliseconds so your flow never breaks.",
  },
  {
    icon: Heart,
    c: LANDING.violet,
    t: "Collaboration by default",
    d: "Great software is built together. We design for real-time, multiplayer, human teamwork.",
  },
  {
    icon: Sparkles,
    c: LANDING.emerald,
    t: "AI-native, not AI-bolted",
    d: "Nova AI is woven into the workflow — not a sidebar you forgot to open.",
  },
  {
    icon: Shield,
    c: LANDING.blue,
    t: "Trust & security",
    d: "Your code is yours. Isolation, encryption, and SOC 2 by default, not as an afterthought.",
  },
  {
    icon: Target,
    c: LANDING.violet,
    t: "Ship the future",
    d: "We build the tool we wished existed — and ship it the day it's ready.",
  },
] as const;

const TEAM = [
  {
    i: "AA",
    n: "Alireza Akbarzadeh",
    r: "Co-founder & CEO",
    c: "from-blue-500 to-violet-500",
  },
  {
    i: "SL",
    n: "Sarah Lin",
    r: "Co-founder",
    c: "from-blue-500 to-cyan-400",
  },
  {
    i: "MC",
    n: "Maya Chen",
    r: "Co-founder & CTO",
    c: "from-violet-500 to-fuchsia-400",
  },
  {
    i: "AB",
    n: "Ava Brooks",
    r: "Head of Engineering",
    c: "from-emerald-500 to-teal-400",
  },
  {
    i: "JD",
    n: "Jordan Diaz",
    r: "Head of Product",
    c: "from-amber-500 to-orange-400",
  },
  {
    i: "EV",
    n: "Elena Voss",
    r: "Head of Design",
    c: "from-cyan-500 to-blue-400",
  },
  {
    i: "RP",
    n: "Raj Patel",
    r: "Head of Infra",
    c: "from-fuchsia-500 to-violet-400",
  },
] as const;

const MILESTONES = [
  { y: "2024", t: "Founded in Berlin" },
  { y: "2024", t: "First private beta — 1,000 builders" },
  { y: "2025", t: "Nova AI launches — public beta" },
  { y: "2025", t: "Series A — $40M to scale the platform" },
  { y: "2026", t: "120K developers, 8M deploys / month" },
] as const;

export function AboutView() {
  return (
    <div
      className="relative min-h-dvh overflow-x-hidden text-white"
      style={{ background: LANDING.bg }}
    >
      <CursorGlow />
      <LandingNav />
      <GlowOrb className="top-[5%] left-[-10%]" color={LANDING.violet} size={520} />
      <GlowOrb
        className="top-[20%] right-[-10%]"
        color={LANDING.cyan}
        size={460}
        delay={3}
      />

      <Section className="pt-32 sm:pt-40">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Our story</SectionLabel>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              display.className,
              "mt-4 text-4xl leading-[1.1] font-semibold tracking-tight text-white sm:text-6xl",
            )}
          >
            We&apos;re building the platform where teams
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
              {" "}
              ship software together.
            </span>
          </motion.h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-white/55 sm:text-lg">
            NovaStudio started with a simple frustration: development tools were
            powerful but lonely. We believed building software should feel as
            collaborative and fast as the best creative tools — and AI should be
            a teammate, not a chatbot in another tab.
          </p>
        </div>
      </Section>

      <Section className="py-12">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md md:grid-cols-4 md:p-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {s.v}
              </div>
              <div className="mt-1 text-xs text-white/40">{s.l}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section className="py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <SectionLabel>The mission</SectionLabel>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className={cn(
                display.className,
                "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl",
              )}
            >
              From idea to deploy, in one place
            </motion.h2>
            <p className="mt-5 text-white/55">
              In 2024, our founders were running distributed engineering teams
              across three time zones. Every project meant stitching together an
              IDE, a terminal, a review tool, a deploy pipeline, and a chatbot —
              none of which talked to each other.
            </p>
            <p className="mt-4 text-white/55">
              So we built NovaStudio: a single cloud workspace where
              collaborators edit together in real time, Nova AI contributes code
              and reviews as a real teammate, and shipping to production takes
              one click. Today, 120,000+ developers build on NovaStudio.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                className="rounded-xl bg-white text-black hover:bg-white/90"
              >
                <Link href="/contact">
                  Join the team <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/blog">Read our blog</Link>
              </Button>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.12] via-violet-500/[0.08] to-cyan-500/[0.05] p-8 backdrop-blur-md"
          >
            <GlowOrb
              className="top-[-40%] left-[20%]"
              color={LANDING.violet}
              size={360}
            />
            <div className="relative space-y-4">
              {MILESTONES.map((m, i) => (
                <div key={`${m.y}-${m.t}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-400 to-violet-400" />
                    {i < MILESTONES.length - 1 ? (
                      <div className="mt-1 h-10 w-px bg-white/10" />
                    ) : null}
                  </div>
                  <div className="-mt-1">
                    <div className="text-xs text-cyan-400">{m.y}</div>
                    <div className="text-sm text-white/80">{m.t}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Section>

      <Section className="py-16">
        <div className="mb-12 text-center">
          <SectionLabel>What we value</SectionLabel>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn(
              display.className,
              "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl",
            )}
          >
            Principles we build by
          </motion.h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.div
              key={v.t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-colors hover:border-white/20"
            >
              <div
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${v.c}1a` }}
              >
                <v.icon className="h-5 w-5" style={{ color: v.c }} />
              </div>
              <h3 className="text-base font-semibold text-white">{v.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {v.d}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section className="py-16">
        <div className="mb-12 text-center">
          <SectionLabel>Leadership</SectionLabel>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={cn(
              display.className,
              "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl",
            )}
          >
            The people behind NovaStudio
          </motion.h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((m, i) => (
            <motion.div
              key={m.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
              whileHover={{ y: -4 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/20"
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br text-lg font-semibold text-white",
                  m.c,
                )}
              >
                {m.i}
              </div>
              <div>
                <div className="text-base font-medium text-white">{m.n}</div>
                <div className="text-sm text-white/40">{m.r}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      <Section className="py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.12] via-violet-500/[0.08] to-cyan-500/[0.05] p-10 text-center backdrop-blur-md sm:p-14">
          <GlowOrb
            className="top-[-40%] left-[10%]"
            color={LANDING.violet}
            size={460}
          />
          <div className="relative">
            <h2
              className={cn(
                display.className,
                "text-3xl font-semibold tracking-tight text-white sm:text-4xl",
              )}
            >
              Come build the future with us
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/55">
              Explore open roles, or just say hello — we&apos;d love to hear from
              you.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-white px-6 text-black hover:bg-white/90"
              >
                <Link href="/contact">
                  View open roles <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              >
                <Link href="/">Try NovaStudio</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <LandingFooter />
    </div>
  );
}
