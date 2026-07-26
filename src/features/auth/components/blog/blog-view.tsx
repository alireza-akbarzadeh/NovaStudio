"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
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

import { formatBlogDate, initials } from "./blog-format";

const CATS = [
  "All",
  "Engineering",
  "AI",
  "Product",
  "Company",
  "Tutorials",
] as const;

type Category = (typeof CATS)[number];
type BlogPost = Doc<"blogPosts">;

function PostCover({ post, big = false }: { post: BlogPost; big?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-gradient-to-br",
        post.gradient,
        big ? "h-56 md:h-72" : "h-40",
      )}
    >
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:24px_24px]" />
      <span className="absolute top-4 left-4 rounded-md border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-md">
        {post.category}
      </span>
    </div>
  );
}

export function BlogView() {
  const seedDefaults = useMutation(api.blog.seedDefaults);
  const joinWaitlist = useMutation(api.waitlist.join);
  const [cat, setCat] = useState<Category>("All");
  const [email, setEmail] = useState("");
  const [subStatus, setSubStatus] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [subError, setSubError] = useState("");
  const [seeded, setSeeded] = useState(false);

  const featured = useQuery(api.blog.getFeatured);
  const allPosts = useQuery(api.blog.list, {});
  const posts = useQuery(
    api.blog.list,
    cat === "All" ? {} : { category: cat },
  );

  useEffect(() => {
    if (seeded || allPosts === undefined) return;
    if (allPosts.length > 0) {
      setSeeded(true);
      return;
    }
    void seedDefaults()
      .then(() => setSeeded(true))
      .catch(() => setSeeded(true));
  }, [allPosts, seedDefaults, seeded]);

  const rest =
    posts?.filter((p) => (featured ? p._id !== featured._id : true)) ?? [];

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubStatus("sending");
      setSubError("");
      await joinWaitlist({ email: email.trim(), source: "blog" });
      setSubStatus("done");
      setEmail("");
    } catch (err) {
      setSubStatus("error");
      setSubError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  };

  const loading =
    posts === undefined || featured === undefined || allPosts === undefined;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#06070d] font-sans text-white antialiased selection:bg-ws-accent/30 selection:text-white">
      <CursorGlow />
      <LandingNav />
      <GlowOrb className="top-[5%] left-[-10%]" color={LANDING.blue} size={520} />
      <GlowOrb
        className="top-[30%] right-[-10%]"
        color={LANDING.violet}
        size={460}
        delay={3}
      />

      <main>
        <Section className="pt-32 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <SectionLabel>NovaStudio Blog</SectionLabel>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                display.className,
                "mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl",
              )}
            >
              Stories from the team building the future of dev
            </motion.h1>
            <p className="mx-auto mt-4 max-w-xl text-white/55">
              Engineering deep dives, product updates, tutorials, and company
              news.
            </p>
          </div>
        </Section>

        <Section className="py-14">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-white/40">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : featured ? (
            <Link href={`/blog/${featured.slug}`}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group grid gap-8 rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md md:grid-cols-2 md:p-8"
              >
                <PostCover post={featured} big />
                <div className="flex flex-col justify-center">
                  <div className="mb-3 flex items-center gap-2 text-xs text-white/40">
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
                      Featured
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />{" "}
                      {formatBlogDate(featured.publishedAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl leading-tight font-semibold tracking-tight text-white">
                    {featured.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">
                    {featured.excerpt}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400 text-xs font-semibold text-white">
                        {initials(featured.author)}
                      </div>
                      <div>
                        <div className="text-sm text-white">{featured.author}</div>
                        <div className="text-xs text-white/40">
                          {featured.readTimeMinutes} min read
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ) : null}
        </Section>

        <Section className="py-6">
          <div className="mb-8 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  cat === c
                    ? "border-white/20 bg-white text-black"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/10 hover:text-white",
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {loading ? null : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((p, i) => (
                <Link key={p._id} href={`/blog/${p.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
                    whileHover={{ y: -4 }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md transition-colors hover:border-white/20"
                  >
                    <PostCover post={p} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{" "}
                          {formatBlogDate(p.publishedAt)}
                        </span>
                        <span>·</span>
                        <span>{p.readTimeMinutes} min</span>
                      </div>
                      <h3 className="text-base leading-snug font-medium text-white">
                        {p.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50">
                        {p.excerpt}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-white/60">{p.author}</span>
                        <ArrowUpRight className="h-4 w-4 text-white/30 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section className="py-16 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/[0.1] via-violet-500/[0.08] to-cyan-500/[0.05] p-8 text-center backdrop-blur-md sm:p-12">
            <GlowOrb
              className="top-[-40%] left-[10%]"
              color={LANDING.violet}
              size={420}
            />
            <div className="relative">
              <h2
                className={cn(
                  display.className,
                  "text-2xl font-semibold tracking-tight text-white sm:text-3xl",
                )}
              >
                Never miss an update
              </h2>
              <p className="mx-auto mt-3 max-w-md text-white/55">
                Get product launches, engineering deep dives, and tutorials
                straight to your inbox.
              </p>
              <form
                onSubmit={subscribe}
                className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
              >
                {subStatus === "done" ? (
                  <p className="flex w-full items-center justify-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> You&apos;re on the list.
                  </p>
                ) : (
                  <>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                      aria-label="Email address"
                    />
                    <Button
                      type="submit"
                      disabled={subStatus === "sending"}
                      className="rounded-xl bg-white text-black hover:bg-white/90 disabled:opacity-60"
                    >
                      {subStatus === "sending" ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{" "}
                          Saving
                        </>
                      ) : (
                        <>
                          Subscribe <ArrowRight className="ml-1.5 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </>
                )}
              </form>
              {subError ? (
                <p className="mt-2 text-sm text-amber-400">{subError}</p>
              ) : null}
            </div>
          </div>
        </Section>
      </main>

      <LandingFooter />
    </div>
  );
}
