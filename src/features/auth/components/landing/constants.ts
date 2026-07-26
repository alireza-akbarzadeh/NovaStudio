import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Bug,
  CheckCircle2,
  Cloud,
  Code2,
  FileText,
  Gauge,
  GitBranch,
  Layers,
  MessageSquare,
  Palette,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

import { LANDING } from "./landing-colors";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "AI", href: "#ai" },
  { label: "Collaboration", href: "#collab" },
  { label: "Workflow", href: "#workflow" },
  { label: "Community", href: "#community" },
  { label: "Pricing", href: "#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "#faq" },
] as const;

export const CODE_LINES = [
  {
    n: 1,
    parts: [
      { t: "async function", c: "text-violet-400" },
      { t: " " },
      { t: "shipFeature", c: "text-blue-400" },
      { t: "(" },
      { t: "spec", c: "text-cyan-400" },
      { t: ") {", c: "text-slate-400" },
    ],
  },
  {
    n: 2,
    parts: [
      { t: "  const ", c: "text-violet-400" },
      { t: "plan ", c: "text-slate-200" },
      { t: "= await ", c: "text-violet-400" },
      { t: "NovaAI", c: "text-blue-400" },
      { t: ".plan", c: "text-blue-400" },
      { t: "(" },
      { t: "spec", c: "text-cyan-400" },
      { t: ");", c: "text-slate-400" },
    ],
  },
  {
    n: 3,
    parts: [
      { t: "  const ", c: "text-violet-400" },
      { t: "code ", c: "text-slate-200" },
      { t: "= await ", c: "text-violet-400" },
      { t: "NovaAI", c: "text-blue-400" },
      { t: ".generate", c: "text-blue-400" },
      { t: "(" },
      { t: "plan", c: "text-cyan-400" },
      { t: ");", c: "text-slate-400" },
    ],
  },
  {
    n: 4,
    parts: [
      { t: "  const ", c: "text-violet-400" },
      { t: "tests ", c: "text-slate-200" },
      { t: "= await ", c: "text-violet-400" },
      { t: "NovaAI", c: "text-blue-400" },
      { t: ".tests", c: "text-blue-400" },
      { t: "(" },
      { t: "code", c: "text-cyan-400" },
      { t: ");", c: "text-slate-400" },
    ],
  },
  {
    n: 5,
    parts: [
      { t: "  return ", c: "text-violet-400" },
      { t: "await ", c: "text-violet-400" },
      { t: "publish", c: "text-blue-400" },
      { t: "({ ", c: "text-slate-400" },
      { t: "code", c: "text-cyan-400" },
      { t: ", ", c: "text-slate-400" },
      { t: "tests", c: "text-cyan-400" },
      { t: " });", c: "text-slate-400" },
    ],
  },
  {
    n: 6,
    parts: [{ t: "}", c: "text-slate-400" }],
  },
] as const;

export type FeatureItem = {
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
  points: string[];
};

export const FEATURES: FeatureItem[] = [
  {
    icon: Users,
    color: LANDING.blue,
    title: "Live Collaboration",
    desc: "Edit together with live cursors, shared workspaces, presence, and a terminal that stays in sync with your team.",
    points: [
      "Live cursors",
      "Shared workspaces",
      "Multiplayer editing",
      "Instant sync",
      "Team presence",
      "Shared terminal",
    ],
  },
  {
    icon: Bot,
    color: LANDING.violet,
    title: "Ask NovaStudio",
    desc: "Generate, explain, and refactor against open files and the project tree — without leaving the editor.",
    points: [
      "Code generation",
      "In-context chat",
      "Bug detection",
      "Refactoring",
      "Test suggestions",
      "Docs drafts",
    ],
  },
  {
    icon: Cloud,
    color: LANDING.cyan,
    title: "Cloud Development",
    desc: "A browser-based IDE with Monaco, file explorer, Git tools, and a real terminal — zero install.",
    points: [
      "Browser-based IDE",
      "Instant environments",
      "Zero setup",
      "Cloud storage",
      "Git integration",
      "Workspace sharing",
    ],
  },
  {
    icon: Zap,
    color: LANDING.emerald,
    title: "Developer Experience",
    desc: "Fast editor performance, keyboard-first flows, multi-file tabs, themes, and instant project search.",
    points: [
      "Lightning-fast",
      "Keyboard shortcuts",
      "Multi-file tabs",
      "Themes",
      "Command palette",
      "Instant search",
    ],
  },
];

export type AiCard = {
  icon: LucideIcon;
  title: string;
  desc: string;
  c: string;
};

export const AI_CARDS: AiCard[] = [
  {
    icon: Code2,
    title: "Code Generation",
    desc: "Generate focused changes from a prompt.",
    c: LANDING.blue,
  },
  {
    icon: Bug,
    title: "Bug Detection",
    desc: "Catch issues before they ship.",
    c: LANDING.violet,
  },
  {
    icon: Wand2,
    title: "Refactoring",
    desc: "Clean, idiomatic improvements.",
    c: LANDING.cyan,
  },
  {
    icon: FileText,
    title: "Documentation",
    desc: "Draft docs from your codebase.",
    c: LANDING.emerald,
  },
  {
    icon: ShieldCheck,
    title: "Security Review",
    desc: "Surface risky patterns in context.",
    c: LANDING.blue,
  },
  {
    icon: Gauge,
    title: "Performance",
    desc: "Optimisations suggested in place.",
    c: LANDING.violet,
  },
];

export type WorkflowStep = {
  n: string;
  icon: LucideIcon;
  title: string;
  desc: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    n: "01",
    icon: Rocket,
    title: "Create Workspace",
    desc: "Spin up a browser workspace — editor, tree, and terminal together.",
  },
  {
    n: "02",
    icon: Users,
    title: "Invite Your Team",
    desc: "Share the project and bring collaborators into the same surface.",
  },
  {
    n: "03",
    icon: Code2,
    title: "Build Together",
    desc: "Code live with multiplayer editing and presence.",
  },
  {
    n: "04",
    icon: Bot,
    title: "Ask NovaStudio",
    desc: "Generate, explain, and review changes against open files.",
  },
  {
    n: "05",
    icon: CheckCircle2,
    title: "Review the Diff",
    desc: "Inspect git status, accept edits, and keep history visible.",
  },
  {
    n: "06",
    icon: Cloud,
    title: "Ship from the Browser",
    desc: "Commit, publish, and run commands without leaving the tab.",
  },
];

export const FAQS = [
  {
    q: "Does NovaStudio send my code to the cloud?",
    a: "Your workspace runs in the browser against your project storage. AI features use the models configured for your plan — review Clerk Billing entitlements for what’s included.",
  },
  {
    q: "Do I need to install anything?",
    a: "No desktop app. Sign in, open a project, and the editor, Git tools, and terminal load in the browser.",
  },
  {
    q: "Can I clone from GitHub?",
    a: "Yes. Connect GitHub and clone a repository into a NovaStudio workspace, then edit and publish from the same UI.",
  },
  {
    q: "How does live collaboration work?",
    a: "Teammates can edit shared workspaces with live cursors and presence. Changes sync in the cloud workspace so you stay aligned without constant merges.",
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

export type LogoItem = {
  n: string;
  Icon: LucideIcon;
};

export const LOGOS: LogoItem[] = [
  { n: "GitHub", Icon: GitBranch },
  { n: "Git", Icon: Layers },
  { n: "Terminal", Icon: Terminal },
  { n: "AI", Icon: Sparkles },
  { n: "Monaco", Icon: Code2 },
  { n: "Search", Icon: Search },
  { n: "Themes", Icon: Palette },
  { n: "Chat", Icon: MessageSquare },
  { n: "Cloud", Icon: Cloud },
  { n: "Bot", Icon: Bot },
];

export type StatItem = {
  v: number;
  suf: string;
  l: string;
  dec?: number;
};

export const STATS: StatItem[] = [
  { v: 1, suf: "", l: "Browser workspace" },
  { v: 0, suf: "", l: "Installs required" },
  { v: 4, suf: "+", l: "Surfaces in one tab" },
  { v: 100, suf: "%", l: "In-browser loop" },
];

export type Testimonial = {
  q: string;
  n: string;
  role: string;
  c: string;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    q: "Editor, terminal, Git, and Ask NovaStudio in one tab finally killed our tool-hopping.",
    n: "Alex Rivera",
    role: "Full-stack engineer",
    c: "from-blue-500 to-cyan-400",
  },
  {
    q: "I open a project, describe the change, review the diff, and ship — without leaving the browser.",
    n: "Jordan Lee",
    role: "Indie builder",
    c: "from-violet-500 to-fuchsia-400",
  },
  {
    q: "Live presence and shared workspaces make pair sessions feel local, even when we're remote.",
    n: "Sam Okonkwo",
    role: "Tech lead",
    c: "from-emerald-500 to-teal-400",
  },
  {
    q: "Ask NovaStudio against open files is the first AI chat that actually understands my workspace.",
    n: "Priya Shah",
    role: "Frontend engineer",
    c: "from-amber-500 to-orange-400",
  },
  {
    q: "Cloning from GitHub into a ready IDE with terminal next to it cut our onboarding to minutes.",
    n: "Chris Nguyen",
    role: "Engineering manager",
    c: "from-cyan-500 to-blue-400",
  },
  {
    q: "The polish is real — it feels designed for the whole loop, not bolted together.",
    n: "Morgan Ellis",
    role: "Product engineer",
    c: "from-fuchsia-500 to-violet-400",
  },
];

/** Kept for unmounted product showcase / roadmap components. */
export const SHOWCASES = [
  {
    id: "workspace",
    eyebrow: "Workspace",
    title: "Editor, terminal, and AI on one surface.",
    description:
      "Open a file, ask NovaStudio to change it, run the command that fails, and fix it — without hopping tools.",
    bullets: [
      "Monaco editor with multi-file tabs",
      "Integrated terminal for install, run, and debug",
      "Ask NovaStudio with project-aware suggestions",
    ],
    image: "/code.png",
    imageAlt:
      "NovaStudio workspace showing the code editor, file tree, terminal, and Ask NovaStudio assistant",
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
      "NovaStudio projects dashboard with project cards, filters, and workspace shortcuts",
  },
] as const;

export const COMING_SOON = [
  {
    label: "Live multiplayer",
    description:
      "Shared cursors and presence so teammates edit the same file in real time.",
  },
  {
    label: "One-click deploy",
    description:
      "Ship previews and production from the workspace without leaving NovaStudio.",
  },
  {
    label: "Branch & PR review",
    description:
      "Open diffs, comment inline, and push review-ready branches from the hub.",
  },
  {
    label: "Custom agents",
    description:
      "Specialized NovaStudio agents for tests, refactors, migrations, and docs.",
  },
  {
    label: "Template marketplace",
    description:
      "Start from community starters — Vue, React, Next, and more — ready to fork.",
  },
  {
    label: "Mobile companion",
    description:
      "Review diffs, approve AI patches, and check builds from your phone.",
  },
] as const;
