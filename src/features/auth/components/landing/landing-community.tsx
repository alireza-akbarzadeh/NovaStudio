"use client";

import {
  ArrowRight,
  GitPullRequest,
  Heart,
  Star,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { display } from "./display-font";
import { LANDING } from "./landing-colors";
import { Section, SectionLabel } from "./landing-section";

function GithubIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/images/github.png"
      alt=""
      width={20}
      height={20}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}

const GITHUB_ORG = "https://github.com/alireza-akbarzadeh";
const GITHUB_REPO = "https://github.com/alireza-akbarzadeh/NovaStudio";
const GITHUB_SPONSORS = "https://github.com/sponsors/alireza-akbarzadeh";

const CONTRIBUTORS = [
  {
    i: "AA",
    n: "Alireza Akbarzadeh",
    gh: "alireza-akbarzadeh",
    c: "from-blue-500 to-violet-500",
    prs: 220,
    role: "Creator",
  },

] as const;

const SPONSORS = [
  {
    tier: "Platinum",
    color: LANDING.blue,
    names: ["CloudCore", "StackHub", "Nebula Compute"],
  },
  {
    tier: "Gold",
    color: LANDING.violet,
    names: ["Vela Labs", "OrbitDB", "Quanta", "Forgepay"],
  },
  {
    tier: "Silver",
    color: LANDING.cyan,
    names: ["Bitline", "Mocha", "Streamlet", "Pinpoint", "Harbor", "Lineup"],
  },
] as const;

export function LandingCommunity() {
  return (
    <Section id="community" className="scroll-mt-24 py-24">
      <div className="mb-12 text-center">
        <SectionLabel>Community</SectionLabel>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={cn(
            display.className,
            "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl",
          )}
        >
          Built by the community
        </motion.h2>
        <p className="mx-auto mt-4 max-w-xl text-white/50">
          NovaStudio is open in spirit and loved by builders worldwide.
          Contribute code, sponsor the project, or just say hi.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-white/10 bg-white/2 p-6 backdrop-blur-md sm:p-8"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium text-white">
            <Users className="h-4 w-4 text-cyan-400" />{" "}
            {CONTRIBUTORS.length * 40}+ contributors
          </h3>
          <a
            href={GITHUB_ORG}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/50 transition-colors hover:text-white"
          >
            <GithubIcon className="h-3.5 w-3.5" /> View on GitHub{" "}
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {CONTRIBUTORS.map((c, i) => (
            <motion.a
              key={c.gh}
              href={`https://github.com/${c.gh}`}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 6) * 0.05, duration: 0.3 }}
              whileHover={{ y: -4 }}
              className={cn(
                "group relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors hover:border-white/20",
                "role" in c && c.role
                  ? "border-cyan-400/30 bg-cyan-500/4 ring-1 ring-cyan-400/20"
                  : "border-white/10",
              )}
            >
              {"role" in c && c.role ? (
                <span className="absolute -top-2 rounded-full border border-cyan-400/30 bg-[#06070d] px-2 py-0.5 text-[9px] font-medium tracking-wide text-cyan-300 uppercase">
                  {c.role}
                </span>
              ) : null}
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white",
                  c.c,
                )}
              >
                {c.i}
              </div>
              <div className="text-xs font-medium text-white">{c.n}</div>
              <div className="flex items-center gap-1 text-[10px] text-white/40">
                <GithubIcon className="h-3 w-3" /> @{c.gh}
              </div>
              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-cyan-400">
                <GitPullRequest className="h-3 w-3" /> {c.prs}
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      <div className="mt-10">
        <motion.h3
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-5 flex items-center justify-center gap-2 text-sm font-medium text-white"
        >
          <Heart className="h-4 w-4 text-rose-400" /> Our sponsors
        </motion.h3>
        <div className="grid gap-4 md:grid-cols-3">
          {SPONSORS.map((s, i) => (
            <motion.div
              key={s.tier}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-white/60 uppercase">
                  {s.tier}
                </span>
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md"
                  style={{ background: `${s.color}1a` }}
                >
                  <Star className="h-3.5 w-3.5" style={{ color: s.color }} />
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.names.map((n) => (
                  <span
                    key={n}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.1] to-cyan-500/[0.05] p-7 backdrop-blur-md transition-colors hover:border-white/20"
        >
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/20 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
              <GithubIcon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Become a contributor
            </h3>
            <p className="mt-2 text-sm text-white/55">
              File issues, ship features, and improve the platform builders love.
              Every PR counts.
            </p>
            <Button
              asChild
              className="mt-5 rounded-xl bg-white text-black hover:bg-white/90"
            >
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                Start contributing <ArrowRight className="ml-1.5 h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/[0.1] to-fuchsia-500/[0.05] p-7 backdrop-blur-md transition-colors hover:border-white/20"
        >
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/20 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />
          <div className="relative">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
              <Heart className="h-5 w-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">
              Become a sponsor
            </h3>
            <p className="mt-2 text-sm text-white/55">
              Support the platform powering modern cloud development. Help keep
              NovaStudio shipping.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                asChild
                className="rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:opacity-90"
              >
                <a
                  href={GITHUB_SPONSORS}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sponsor NovaStudio <ArrowRight className="ml-1.5 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
