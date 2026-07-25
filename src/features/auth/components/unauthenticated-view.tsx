"use client";

import {
  Show,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { Manrope } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";

import { AppUserButton } from "@/features/billing/components/app-user-button";
import { PricingSection } from "@/features/billing/components/pricing-section";
import { useProjectsDialog } from "@/features/projects/components/projects-dialog";
import { cn } from "@/lib/utils";

const display = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const FEATURES = [
  {
    id: "ai",
    label: "01 // AI",
    title: "Ask Polaris in context",
    description:
      "Chat against open files, the project tree, and diffs. Explain, refactor, or create — without leaving the editor.",
  },
  {
    id: "ide",
    label: "02 // IDE",
    title: "Full browser workspace",
    description:
      "Monaco editor, file explorer, multi-file tabs, and a real terminal — the whole loop runs in the browser.",
  },
  {
    id: "projects",
    label: "03 // Projects",
    title: "Hub for every workspace",
    description:
      "Search, pin, share, and continue where you left off. Import from GitHub or start fresh in one click.",
  },
  {
    id: "git",
    label: "04 // Git",
    title: "Status to publish",
    description:
      "Inspect changes, commit, and publish from the same surface you edit in — no context switch.",
  },
  {
    id: "terminal",
    label: "05 // Terminal",
    title: "Shell beside the code",
    description:
      "Install packages, run scripts, and debug failures next to the editor with live workspace sync.",
  },
  {
    id: "team",
    label: "06 // Team",
    title: "Invite and collaborate",
    description:
      "Share projects, manage members, and keep notifications and shortcuts within reach.",
  },
] as const;

const SHOWCASES = [
  {
    id: "workspace",
    eyebrow: "Workspace",
    title: "Editor, terminal, and AI on one surface.",
    description:
      "Open a file, ask Polaris to change it, run the command that fails, and fix it — without hopping tools.",
    bullets: [
      "Monaco editor with multi-file tabs",
      "Integrated terminal for install, run, and debug",
      "Ask Polaris with project-aware suggestions",
    ],
    image: "/code.png",
    imageAlt:
      "Polaris workspace showing the code editor, file tree, terminal, and Ask Polaris assistant",
  },
  {
    id: "hub",
    eyebrow: "Projects hub",
    title: "Every project, one command center.",
    description:
      "Find what you were working on, pin what matters, import repos, and jump back into a workspace in seconds.",
    bullets: [
      "Pinned, recent, shared, and community views",
      "Search across projects, tech, and owners",
      "New project and GitHub import in one place",
    ],
    image: "/project-panel.png",
    imageAlt:
      "Polaris projects dashboard with project cards, filters, and workspace shortcuts",
  },
] as const;

const COMING_SOON = [
  {
    label: "Live multiplayer",
    description: "Shared cursors and presence so teammates edit the same file in real time.",
  },
  {
    label: "One-click deploy",
    description: "Ship previews and production from the workspace without leaving Polaris.",
  },
  {
    label: "Branch & PR review",
    description: "Open diffs, comment inline, and push review-ready branches from the hub.",
  },
  {
    label: "Custom agents",
    description: "Specialized Polaris agents for tests, refactors, migrations, and docs.",
  },
  {
    label: "Template marketplace",
    description: "Start from community starters — Vue, React, Next, and more — ready to fork.",
  },
  {
    label: "Mobile companion",
    description: "Review diffs, approve AI patches, and check builds from your phone.",
  },
] as const;

const WORKFLOW_STEPS = [
  {
    n: "01",
    t: "Open a workspace",
    d: "Create a project or clone from GitHub. Polaris boots the editor, file tree, and terminal together.",
  },
  {
    n: "02",
    t: "Describe intent",
    d: "Chat with the assistant against your open files, or select code and ask for a focused change.",
  },
  {
    n: "03",
    t: "Review the diff",
    d: "Accept edits in the editor, inspect git status, and keep history visible without leaving the tab.",
  },
  {
    n: "04",
    t: "Ship from the browser",
    d: "Commit, publish, and run commands in the workspace terminal — same surface end to end.",
  },
] as const;

const FAQS = [
  {
    q: "Does Polaris send my code to the cloud?",
    a: "Your workspace runs in the browser against your project storage. AI features use the models configured for your plan — review Clerk Billing entitlements for what’s included.",
  },
  {
    q: "Do I need to install anything?",
    a: "No desktop app. Sign in, open a project, and the editor, Git tools, and terminal load in the browser.",
  },
  {
    q: "Can I clone from GitHub?",
    a: "Yes. Connect GitHub and clone a repository into a Polaris workspace, then edit and publish from the same UI.",
  },
  {
    q: "How does pricing work?",
    a: "Plans are managed with Clerk Billing. Scroll to Pricing below — the live table shows current tiers and opens checkout when you pick one.",
  },
  {
    q: "What happens after I subscribe?",
    a: "Checkout completes in Clerk’s drawer. You’re redirected to projects, and Pro entitlements unlock features gated by your plan.",
  },
] as const;

function PricingLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href="#pricing" className={className}>
      {children}
    </a>
  );
}

function Nav() {
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
            Polaris
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

function Hero() {
  const { openProjects } = useProjectsDialog();

  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-20 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-ws-accent/20 opacity-50 blur-[160px]"
      />

      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="animate-float">
          <p
            className={cn(
              display.className,
              "mb-6 text-[clamp(2.75rem,9vw,5.75rem)] leading-[0.9] font-extrabold tracking-[-0.04em] text-white",
            )}
          >
            Polaris
          </p>
          <h1 className="mx-auto mb-6 max-w-5xl text-balance text-3xl font-bold tracking-tight text-white md:mb-8 md:text-6xl md:leading-[1.05]">
            Ship code{" "}
            <span className="text-[#8b8e96]">at the speed of</span> thought.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-balance text-base font-medium leading-relaxed text-[#8b8e96] md:mb-12 md:text-xl">
            The AI workspace for building software. Editor, terminal, Git, and
            Ask Polaris — zero install, in the browser.
          </p>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-3 md:mb-14">
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/projects">
                <button
                  type="button"
                  className="rounded-md bg-ws-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-ws-accent-hover"
                >
                  Start building
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/projects">
                <button
                  type="button"
                  className="rounded-md border border-white/10 bg-transparent px-5 py-2.5 text-[14px] text-[#bcbec4] transition-colors hover:border-white/20 hover:text-white"
                >
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <button
                type="button"
                onClick={() => openProjects()}
                className="rounded-md bg-ws-accent px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-ws-accent-hover"
              >
                Open projects
              </button>
              <PricingLink className="rounded-md border border-white/10 bg-transparent px-5 py-2.5 text-[14px] text-[#bcbec4] transition-colors hover:border-white/20 hover:text-white">
                View pricing
              </PricingLink>
            </Show>
          </div>
        </div>

        <div
          className="animate-float relative mx-auto max-w-6xl"
          style={{ animationDelay: "200ms" }}
        >
          <div
            aria-hidden
            className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-white/15 to-transparent opacity-10 blur-sm"
          />
          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0E] shadow-[0_48px_100px_-20px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-4 py-3 md:px-5">
              <div className="flex w-20 gap-1.5 md:w-24 md:gap-2">
                <div className="size-2.5 rounded-full bg-white/10 md:size-3" />
                <div className="size-2.5 rounded-full bg-white/10 md:size-3" />
                <div className="size-2.5 rounded-full bg-white/10 md:size-3" />
              </div>
              <div className="font-mono text-[10px] tracking-widest text-[#9a9a9a] uppercase opacity-60 md:text-[11px]">
                workspace — Polaris
              </div>
              <div className="flex w-20 justify-end md:w-24">
                <div className="size-3.5 rounded-sm bg-white/10 md:size-4" />
              </div>
            </div>
            <Image
              src="/code.png"
              alt="Polaris AI workspace with code editor, terminal, and Ask Polaris assistant"
              width={1919}
              height={1076}
              priority
              className="h-auto w-full"
              sizes="(max-width: 1152px) 100vw, 1152px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-24 border-t border-white/5 bg-white/[0.01] py-24"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            Features
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            Everything you need to ship in the browser.
          </h2>
          <p className="mt-5 text-balance text-base leading-relaxed text-[#8b8e96] md:text-lg">
            From the first file open to the last commit — AI, IDE, Git, and
            project hub in one workspace.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.id}
              id={feature.id}
              className="scroll-mt-24 bg-[#121316] p-8 transition-colors hover:bg-white/[0.02] md:p-9"
            >
              <div className="mb-5 font-mono text-[10px] font-bold tracking-widest text-ws-accent-soft uppercase">
                {feature.label}
              </div>
              <h3 className="mb-3 text-lg font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-[#8b8e96]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcases() {
  return (
    <section id="product" className="scroll-mt-24 border-t border-white/5">
      {SHOWCASES.map((item, index) => {
        const imageFirst = index % 2 === 1;
        return (
          <div
            key={item.id}
            className={cn(
              "border-b border-white/5 py-24 last:border-b-0 md:py-32",
              index % 2 === 1 && "bg-white/[0.01]",
            )}
          >
            <div
              className={cn(
                "mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 md:px-8",
              )}
            >
              <div className={cn(imageFirst && "md:order-2")}>
                <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
                  {item.eyebrow}
                </div>
                <h2
                  className={cn(
                    display.className,
                    "mb-5 text-3xl font-bold tracking-tight text-white md:text-4xl md:leading-[1.15]",
                  )}
                >
                  {item.title}
                </h2>
                <p className="mb-8 text-base leading-relaxed text-[#8b8e96] md:text-lg">
                  {item.description}
                </p>
                <ul className="space-y-3">
                  {item.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-start gap-3 text-[14px] text-[#bcbec4]"
                    >
                      <span
                        aria-hidden
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ws-accent"
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={cn("relative", imageFirst && "md:order-1")}>
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-8 rounded-full bg-ws-accent/15 blur-[90px]"
                />
                <div
                  className="animate-float relative overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0E] shadow-[0_32px_80px_-24px_rgba(0,0,0,0.75)]"
                  style={{ animationDelay: `${index * 400}ms` }}
                >
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    width={1919}
                    height={1078}
                    className="h-auto w-full"
                    sizes="(max-width: 768px) 100vw, 560px"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function Roadmap() {
  return (
    <section
      id="roadmap"
      className="scroll-mt-24 border-t border-white/5 bg-white/[0.01] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-14 max-w-2xl text-center md:mb-16">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            Coming soon
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            More on the way.
          </h2>
          <p className="mt-5 text-balance text-base leading-relaxed text-[#8b8e96] md:text-lg">
            We&apos;re building the next layer of Polaris — collaboration,
            deploy, and agents that meet you where you already work.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON.map((item) => (
            <div
              key={item.label}
              className="group relative border border-white/5 bg-[#121316]/80 p-6 transition-colors hover:border-white/10 md:p-7"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[15px] font-bold text-white">
                  {item.label}
                </h3>
                <span className="shrink-0 rounded-sm border border-ws-accent/30 bg-ws-accent/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider text-ws-accent-soft uppercase">
                  Soon
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-[#8b8e96]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSteps() {
  return (
    <section
      id="workflow"
      className="scroll-mt-24 border-t border-white/5 bg-white/[0.01] py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center md:mb-20">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            Workflow
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            Four steps. Zero context switching.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/5 bg-white/5 md:grid-cols-4">
          {WORKFLOW_STEPS.map((s) => (
            <div
              key={s.n}
              className="group relative bg-[#121316] p-8 transition-colors hover:bg-white/[0.02]"
            >
              <div className="mb-8 font-mono text-[42px] leading-none font-bold text-white/10 transition-colors group-hover:text-ws-accent/40">
                {s.n}
              </div>
              <h3 className="mb-3 text-lg font-bold text-white">{s.t}</h3>
              <p className="text-[13px] leading-relaxed text-[#8b8e96]">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.25em] text-ws-accent-soft uppercase">
            FAQ
          </div>
          <h2
            className={cn(
              display.className,
              "text-3xl font-bold tracking-tight text-white md:text-5xl",
            )}
          >
            Answers, before you ask.
          </h2>
        </div>
        <div className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-zinc-900/30">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer items-center justify-between text-[15px] font-medium text-white [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="ml-4 font-mono text-lg text-[#9a9a9a] transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-[14px] leading-relaxed text-[#8b8e96]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  const { openProjects } = useProjectsDialog();

  return (
    <section className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-10 text-center md:rounded-[40px] md:p-16">
          <div
            aria-hidden
            className="absolute -top-24 -left-24 size-64 rounded-full bg-ws-accent/15 blur-[100px]"
          />
          <h2
            className={cn(
              display.className,
              "relative mb-6 text-3xl font-bold text-white md:text-4xl",
            )}
          >
            Build for the next era.
          </h2>
          <p className="relative mb-10 text-balance text-base text-[#8b8e96] md:text-lg">
            Create a free account, open a workspace, and start editing with AI,
            Git, and terminal — then grow into what&apos;s coming next.
          </p>

          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <Show when="signed-out">
              <SignUpButton mode="modal" forceRedirectUrl="/projects">
                <button
                  type="button"
                  className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#121316] transition-all hover:bg-zinc-200"
                >
                  Create account
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <button
                type="button"
                onClick={() => openProjects()}
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#121316] transition-all hover:bg-zinc-200"
              >
                Open projects
              </button>
            </Show>
            <PricingLink className="rounded-xl border border-white/10 px-8 py-3.5 text-sm font-medium text-[#bcbec4] transition-colors hover:border-white/20 hover:text-white">
              View pricing
            </PricingLink>
          </div>
          <p className="relative mt-8 font-mono text-[11px] tracking-[0.2em] text-[#9a9a9a]/40 uppercase">
            Browser workspace / AI + Git + terminal
          </p>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { openProjects } = useProjectsDialog();

  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 px-6 md:flex-row md:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 opacity-50"
          />
          <span className="font-mono text-xs font-bold tracking-widest uppercase opacity-40">
            Polaris {new Date().getFullYear()}
          </span>
        </div>
        <div className="flex gap-10 font-mono text-[10px] font-bold tracking-widest text-[#9a9a9a] uppercase">
          <a href="#features" className="transition-colors hover:text-white">
            Features
          </a>
          <a href="#roadmap" className="transition-colors hover:text-white">
            Roadmap
          </a>
          <PricingLink className="transition-colors hover:text-white">
            Pricing
          </PricingLink>
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
        </div>
        <div className="font-mono text-[10px] tracking-widest text-[#9a9a9a]/30 uppercase">
          Designed for precision engineering
        </div>
      </div>
    </footer>
  );
}

export function LandingView() {
  useEffect(() => {
    if (window.location.hash !== "#pricing") return;
    const id = window.setTimeout(() => {
      document.getElementById("pricing")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="min-h-dvh bg-[#121316] font-sans text-[#dfdfdf] selection:bg-ws-accent/30 selection:text-white">
      <Nav />
      <Hero />
      <Features />
      <ProductShowcases />
      <Roadmap />
      <WorkflowSteps />
      <PricingSection />
      <FaqSection />
      <Cta />
      <Footer />
    </div>
  );
}
