import type { Infer } from "convex/values";
import { v } from "convex/values";

export const blogCategory = v.union(
  v.literal("Engineering"),
  v.literal("AI"),
  v.literal("Product"),
  v.literal("Company"),
  v.literal("Tutorials"),
);

export type BlogCategory = Infer<typeof blogCategory>;

/** UTC noon on the given calendar day — stable seed timestamps. */
function day(y: number, m: number, d: number) {
  return Date.UTC(y, m - 1, d, 12, 0, 0);
}

export const BLOG_SEED_POSTS = [
  {
    slug: "inside-nova-ai-2-0",
    title: "Inside Nova AI 2.0: how we built context that actually scales",
    category: "AI" as const,
    author: "Maya Chen",
    excerpt:
      "A look at the retrieval pipeline that lets Nova AI reason across millions of lines.",
    body: `Nova AI 2.0 is built around a retrieval pipeline that keeps the whole workspace in scope without drowning the model in noise.

We index files incrementally, rank chunks by edit proximity and symbol graph distance, and stream only the slices that matter for the current prompt. The result is answers that feel project-aware — not just autocomplete with better marketing.

In this post we walk through the indexer, the ranking heuristics we kept (and the ones we threw away), and how we measure quality when the “right” answer is often subjective.`,
    readTimeMinutes: 9,
    publishedAt: day(2026, 7, 18),
    gradient: "from-violet-500/30 to-fuchsia-500/20",
    featured: true,
    published: true,
  },
  {
    slug: "shipping-the-multiplayer-editor",
    title: "Shipping the multiplayer editor: CRDTs in production",
    category: "Engineering" as const,
    author: "Ava Brooks",
    excerpt:
      "Lessons from building conflict-free real-time collaboration that feels instant.",
    body: `Live cursors look magical until two people type in the same function and everything falls apart.

We settled on CRDTs for the document model, with presence layered on top for cursors and selections. The hard parts were reconnect storms, large paste operations, and keeping Monaco’s undo stack honest.

Here are the production lessons that stuck: how we bound update size, when we snapshot, and why “feels instant” is a latency budget — not a feature flag.`,
    readTimeMinutes: 11,
    publishedAt: day(2026, 7, 10),
    gradient: "from-blue-500/30 to-cyan-500/20",
    featured: false,
    published: true,
  },
  {
    slug: "one-click-deploys-explained",
    title: "One-click deploys, explained",
    category: "Product" as const,
    author: "Jordan Diaz",
    excerpt:
      "How NovaStudio turns an editor into a live URL in seconds — and what's next.",
    body: `One-click deploy is the shortest path from “it works on my machine” to “it’s on the internet.”

Behind the button: detect the framework, wire env vars, push to the provider, and surface logs when something breaks. We talk about what we automate today, what we still ask you to confirm, and the roadmap for previews, rollbacks, and custom domains.`,
    readTimeMinutes: 6,
    publishedAt: day(2026, 7, 2),
    gradient: "from-emerald-500/30 to-teal-500/20",
    featured: false,
    published: true,
  },
  {
    slug: "prompt-patterns-for-code-reviews",
    title: "5 prompt patterns for better code reviews",
    category: "Tutorials" as const,
    author: "Leo Kim",
    excerpt:
      "Practical templates for getting Nova AI to review like your best engineer.",
    body: `A vague “review this” prompt gets vague feedback. These five patterns work better: scope the diff, name the risk, ask for tests, demand alternatives, and force a severity ranking.

Copy the templates, drop them into Nova AI with your PR context, and iterate. Small prompt structure changes make reviews sharper and less noisy.`,
    readTimeMinutes: 7,
    publishedAt: day(2026, 6, 24),
    gradient: "from-amber-500/30 to-orange-500/20",
    featured: false,
    published: true,
  },
  {
    slug: "hiring-million-workspaces",
    title: "We're hiring: scaling the platform to a million workspaces",
    category: "Company" as const,
    author: "Sarah Lin",
    excerpt:
      "Our roadmap, our open roles, and what it's like to build NovaStudio.",
    body: `We’re hiring across platform, AI, and product to support the next order of magnitude of workspaces.

This post covers the problems we care about — isolation, latency, collaboration, and AI that stays grounded in your repo — and what a week looks like on the team. If that sounds like your kind of work, we’d love to talk.`,
    readTimeMinutes: 5,
    publishedAt: day(2026, 6, 15),
    gradient: "from-blue-500/30 to-violet-500/20",
    featured: false,
    published: true,
  },
  {
    slug: "from-spec-to-deploy-in-one-prompt",
    title: "From spec to deploy in one prompt",
    category: "Tutorials" as const,
    author: "David Okonkwo",
    excerpt:
      "A step-by-step workflow turning a feature spec into shipped production code.",
    body: `Start with a crisp spec, let Nova AI scaffold the change, review the diff with a teammate, and ship with one-click deploy.

We walk through a real feature end to end: the prompt, the files that changed, the review checklist, and the deploy confirmation. Use it as a template for your next sprint story.`,
    readTimeMinutes: 8,
    publishedAt: day(2026, 6, 6),
    gradient: "from-cyan-500/30 to-blue-500/20",
    featured: false,
    published: true,
  },
  {
    slug: "designing-the-command-palette",
    title: "Designing the command palette",
    category: "Product" as const,
    author: "Elena Voss",
    excerpt:
      "The UX decisions behind a tool developers reach for a hundred times a day.",
    body: `The command palette has to be fast, predictable, and boring in the best way.

We share the ranking model, empty-state copy, keyboard traps we avoided, and why fuzzy match alone isn’t enough when you have hundreds of actions. Small details — recent commands, scoped results, clear verbs — compound into muscle memory.`,
    readTimeMinutes: 6,
    publishedAt: day(2026, 5, 28),
    gradient: "from-fuchsia-500/30 to-violet-500/20",
    featured: false,
    published: true,
  },
  {
    slug: "observability-for-cloud-dev-environments",
    title: "Observability for cloud dev environments",
    category: "Engineering" as const,
    author: "Raj Patel",
    excerpt:
      "How we keep 99.99% uptime while running ephemeral, isolated containers.",
    body: `Ephemeral environments are great for isolation and terrible for traditional dashboards.

We instrument boot, filesystem, terminal, and network separately, correlate by workspace ID, and alert on boot regressions before users feel them. This post covers the signals that matter, the ones that don’t, and how we debug a flaky workspace without SSH.`,
    readTimeMinutes: 10,
    publishedAt: day(2026, 5, 19),
    gradient: "from-emerald-500/30 to-cyan-500/20",
    featured: false,
    published: true,
  },
] as const;
