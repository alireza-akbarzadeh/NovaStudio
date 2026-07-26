"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "motion/react";
import { ArrowLeft, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
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

export function BlogPostView({ slug }: { slug: string }) {
  const seedDefaults = useMutation(api.blog.seedDefaults);
  const post = useQuery(api.blog.getBySlug, { slug });

  useEffect(() => {
    if (post !== null) return;
    void seedDefaults().catch(() => undefined);
  }, [post, seedDefaults]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#06070d] font-sans text-white antialiased selection:bg-ws-accent/30 selection:text-white">
      <CursorGlow />
      <LandingNav />
      <GlowOrb className="top-[5%] left-[-10%]" color={LANDING.blue} size={480} />
      <GlowOrb
        className="top-[40%] right-[-10%]"
        color={LANDING.violet}
        size={420}
        delay={3}
      />

      <main>
        <Section className="pt-28 sm:pt-32">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>

          {post === undefined ? (
            <div className="flex items-center justify-center py-32 text-white/40">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : post === null ? (
            <div className="py-24 text-center">
              <h1 className="text-2xl font-semibold text-white">Post not found</h1>
              <p className="mt-2 text-sm text-white/50">
                This article may have been moved or unpublished.
              </p>
            </div>
          ) : (
            <article className="mx-auto mt-8 max-w-3xl pb-24">
              <SectionLabel>{post.category}</SectionLabel>
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  display.className,
                  "mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl",
                )}
              >
                {post.title}
              </motion.h1>
              <p className="mt-4 text-base text-white/55">{post.excerpt}</p>

              <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-white/10 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-400 text-xs font-semibold text-white">
                    {initials(post.author)}
                  </div>
                  <div>
                    <div className="text-sm text-white">{post.author}</div>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {formatBlogDate(post.publishedAt)}
                      </span>
                      <span>·</span>
                      <span>{post.readTimeMinutes} min read</span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-br",
                  post.gradient,
                  "h-48 sm:h-64",
                )}
              >
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.4)_1px,transparent_1px)] [background-size:24px_24px]" />
              </div>

              <div className="prose-invert mt-10 space-y-5 text-[15px] leading-relaxed text-white/70">
                {post.body.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </article>
          )}
        </Section>
      </main>

      <LandingFooter />
    </div>
  );
}
