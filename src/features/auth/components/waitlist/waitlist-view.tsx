"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { motion } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
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

const PERKS = [
  {
    icon: Sparkles,
    t: "Early access",
    d: "Be first in line for new AI models, collab features, and deploy targets.",
  },
  {
    icon: Zap,
    t: "Product drops",
    d: "Ship notes and engineering deep dives before they hit the public blog.",
  },
  {
    icon: Users,
    t: "Founders circle",
    d: "Occasional invites to private demos and feedback sessions with the team.",
  },
] as const;

type Status = "idle" | "sending" | "done" | "error";

export function WaitlistView() {
  const join = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      setStatus("error");
      return;
    }
    try {
      setStatus("sending");
      setError("");
      const result = await join({
        email: email.trim(),
        name: name.trim() || undefined,
        source: "waitlist",
      });
      setAlreadyJoined(result.alreadyJoined);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#06070d] font-sans text-white antialiased selection:bg-ws-accent/30 selection:text-white">
      <CursorGlow />
      <LandingNav />
      <GlowOrb
        className="top-[5%] left-[-10%]"
        color={LANDING.violet}
        size={520}
      />
      <GlowOrb
        className="top-[35%] right-[-10%]"
        color={LANDING.cyan}
        size={460}
        delay={3}
      />

      <main>
        <Section className="pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Waitlist</SectionLabel>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                display.className,
                "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl",
              )}
            >
              Get{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                early access
              </span>
            </motion.h1>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Join the NovaStudio waitlist for product launches, private
              previews, and behind-the-scenes updates from the team.
            </p>
          </div>
        </Section>

        <Section className="py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md sm:p-8"
          >
            {status === "done" ? (
              <div className="flex flex-col items-center py-10 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 16 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </motion.div>
                <h2 className="mt-5 text-xl font-semibold text-white">
                  {alreadyJoined ? "You're already on the list" : "You're in"}
                </h2>
                <p className="mt-2 max-w-sm text-sm text-white/55">
                  {alreadyJoined
                    ? "That email is already registered. We'll keep you posted."
                    : "Thanks for joining. We'll reach out when the next drop is ready."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button
                    onClick={() => {
                      setStatus("idle");
                      setEmail("");
                      setName("");
                      setAlreadyJoined(false);
                    }}
                    variant="outline"
                    className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Add another email
                  </Button>
                  <Link href="/blog">
                    <Button className="rounded-xl bg-white text-black hover:bg-white/90">
                      Read the blog <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-white/60">
                    Name (optional)
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ada Lovelace"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-white/60">
                    Work email
                  </span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    autoComplete="email"
                  />
                </label>
                {error ? (
                  <p className="text-sm text-amber-400">{error}</p>
                ) : null}
                <Button
                  type="submit"
                  disabled={status === "sending"}
                  className="h-11 w-full rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-60"
                >
                  {status === "sending" ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      Join the waitlist <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  )}
                </Button>
                <p className="text-center text-xs text-white/35">
                  No spam. Unsubscribe anytime. Prefer a human?{" "}
                  <Link
                    href="/contact"
                    className="text-white/60 underline-offset-2 hover:text-white hover:underline"
                  >
                    Contact us
                  </Link>
                  .
                </p>
              </form>
            )}
          </motion.div>
        </Section>

        <Section className="pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {PERKS.map((p, i) => (
              <motion.div
                key={p.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md"
              >
                <div
                  className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${LANDING.violet}1a` }}
                >
                  <p.icon
                    className="h-4 w-4"
                    style={{ color: LANDING.violet }}
                  />
                </div>
                <h3 className="text-sm font-medium text-white">{p.t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/50">
                  {p.d}
                </p>
              </motion.div>
            ))}
          </div>
        </Section>
      </main>

      <LandingFooter />
    </div>
  );
}
