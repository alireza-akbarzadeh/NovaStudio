"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { motion } from "motion/react";
import {
  Mail,
  MapPin,
  Building2,
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";

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

const TOPICS = ["General", "Sales", "Support", "Press"] as const;

type Topic = (typeof TOPICS)[number];

const CHANNELS = [
  {
    icon: Mail,
    c: LANDING.blue,
    t: "Email us",
    d: "hello@novastudio.dev",
    sub: "We reply within one business day.",
  },
  {
    icon: MessageSquare,
    c: LANDING.violet,
    t: "Community",
    d: "Discord & Forum",
    sub: "Chat with 30K+ builders and the team.",
  },
  {
    icon: Building2,
    c: LANDING.emerald,
    t: "Sales",
    d: "sales@novastudio.dev",
    sub: "For Enterprise, SSO & custom cloud.",
  },
] as const;

const OFFICES = [
  { city: "Berlin", addr: "Torstraße 35, 10119" },
  { city: "San Francisco", addr: "535 Mission St, CA 94105" },
  { city: "Singapore", addr: "8 Marina View, #43" },
] as const;

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none";

const emptyForm = {
  name: "",
  email: "",
  company: "",
  topic: "General" as Topic,
  message: "",
};

type Status = "idle" | "sending" | "done" | "error";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ContactView() {
  const submitMessage = useMutation(api.contact.submitMessage);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const set =
    (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email, and message.");
      setStatus("error");
      return;
    }
    try {
      setStatus("sending");
      setError("");
      await submitMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        topic: form.topic,
        message: form.message.trim(),
      });
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
      <GlowOrb className="top-[5%] left-[-10%]" color={LANDING.blue} size={520} />
      <GlowOrb
        className="top-[25%] right-[-10%]"
        color={LANDING.violet}
        size={460}
        delay={3}
      />

      <main>
        <Section className="pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>Contact</SectionLabel>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                display.className,
                "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl",
              )}
            >
              Let&apos;s{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-300 bg-clip-text text-transparent">
                talk
              </span>
            </motion.h1>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Questions about the product, pricing, enterprise, or careers?
              We&apos;d love to hear from you.
            </p>
          </div>
        </Section>

        <Section className="py-14 pb-24">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md sm:p-8"
            >
              {status === "done" ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 16 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15"
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </motion.div>
                  <h2 className="mt-5 text-xl font-semibold text-white">
                    Message sent
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-white/55">
                    Thanks, {form.name.split(" ")[0] || "there"}! We&apos;ve
                    received your message and will get back to you within one
                    business day.
                  </p>
                  <Button
                    onClick={() => {
                      setStatus("idle");
                      setForm(emptyForm);
                    }}
                    variant="outline"
                    className="mt-6 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={form.name}
                        onChange={set("name")}
                        placeholder="Ada Lovelace"
                        className={inputCls}
                        autoComplete="name"
                      />
                    </Field>
                    <Field label="Work email">
                      <input
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        placeholder="ada@company.com"
                        className={inputCls}
                        autoComplete="email"
                      />
                    </Field>
                  </div>
                  <Field label="Company (optional)">
                    <input
                      value={form.company}
                      onChange={set("company")}
                      placeholder="Analytical Engines Inc."
                      className={inputCls}
                      autoComplete="organization"
                    />
                  </Field>
                  <Field label="Topic">
                    <div className="flex flex-wrap gap-2">
                      {TOPICS.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setForm((f) => ({ ...f, topic: t }))}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                            form.topic === t
                              ? "border-white/20 bg-white text-black"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Message">
                    <textarea
                      value={form.message}
                      onChange={set("message")}
                      rows={5}
                      placeholder="Tell us how we can help..."
                      className={`${inputCls} resize-none`}
                    />
                  </Field>

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
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        Send message <Send className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            <div className="space-y-4">
              {CHANNELS.map((ch, i) => (
                <motion.div
                  key={ch.t}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md transition-colors hover:border-white/20"
                >
                  <div
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ background: `${ch.c}1a` }}
                  >
                    <ch.icon className="h-4 w-4" style={{ color: ch.c }} />
                  </div>
                  <div className="text-sm font-medium text-white">{ch.t}</div>
                  <div className="mt-0.5 text-sm text-cyan-400">{ch.d}</div>
                  <div className="mt-1 text-xs text-white/40">{ch.sub}</div>
                </motion.div>
              ))}

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-md">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                  <MapPin className="h-4 w-4 text-cyan-400" /> Offices
                </div>
                <div className="space-y-3">
                  {OFFICES.map((o) => (
                    <div key={o.city}>
                      <div className="text-sm text-white">{o.city}</div>
                      <div className="text-xs text-white/40">{o.addr}</div>
                    </div>
                  ))}
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
