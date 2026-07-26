import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Check,
  Layers,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";

import { LANDING } from "@/features/auth/components/landing/landing-colors";

/** Matches `data-demo-region` markers inside DemoAppMockup. */
export type DemoRegionId =
  | "frame"
  | "workspace"
  | "collab"
  | "ai"
  | "ship";

export type DemoStep = {
  id: string;
  icon: LucideIcon;
  color: string;
  title: string;
  desc: string;
  region: DemoRegionId;
  /** Extra padding (px) around the measured region. */
  pad?: number;
  badge: string;
  isFinal?: boolean;
};

export const DEMO_STEPS: DemoStep[] = [
  {
    id: "welcome",
    icon: Sparkles,
    color: LANDING.violet,
    title: "Welcome to NovaStudio",
    desc: "The AI workspace where builders ship together in real time. Let's walk through the core experience.",
    region: "frame",
    pad: 0,
    badge: "Overview",
  },
  {
    id: "workspace",
    icon: Layers,
    color: LANDING.cyan,
    title: "1 · Spin up a cloud workspace",
    desc: "Instant environments in the browser — zero setup. Explorer, files, Git, and terminal are ready the moment you sign in.",
    region: "workspace",
    pad: 0,
    badge: "Workspace",
  },
  {
    id: "collab",
    icon: Users,
    color: LANDING.blue,
    title: "2 · Build together, live",
    desc: "Invite anyone with a single link. Live cursors, presence, and shared editing mean the whole team codes in the same file at once.",
    region: "collab",
    pad: 8,
    badge: "Collaboration",
  },
  {
    id: "ai",
    icon: Bot,
    color: LANDING.violet,
    title: "3 · Meet Ask NovaStudio",
    desc: "Ask NovaStudio reads your open files and project tree to generate code, catch bugs, write tests, and refactor — right inside the editor.",
    region: "ai",
    pad: 2,
    badge: "Ask NovaStudio",
  },
  {
    id: "ship",
    icon: Rocket,
    color: LANDING.emerald,
    title: "4 · Ship from the browser",
    desc: "Run tests, commit, and publish without leaving the tab. Status stays visible so you always know what's live.",
    region: "ship",
    pad: 2,
    badge: "Ship",
  },
  {
    id: "ready",
    icon: Check,
    color: LANDING.violet,
    title: "Build the Future Together",
    desc: "That's the core loop: create, collaborate, ask AI, ship. Ready to try it with your own project?",
    region: "frame",
    pad: 0,
    badge: "Get started",
    isFinal: true,
  },
];

export type DemoFile = {
  n: string;
  d: number;
  on?: boolean;
  active?: boolean;
};

export const DEMO_FILES: DemoFile[] = [
  { n: "src", d: 0 },
  { n: "index.ts", d: 1, on: true },
  { n: "feature.ts", d: 1, on: true, active: true },
  { n: "test.ts", d: 1, on: true },
  { n: "package.json", d: 0, on: true },
  { n: "README.md", d: 0, on: true },
];

export const DEMO_TABS = ["index.ts", "feature.ts", "test.ts"] as const;

export const DEMO_AVATARS = [
  { i: "AB", c: "from-blue-500 to-cyan-400" },
  { i: "MC", c: "from-violet-500 to-fuchsia-400" },
  { i: "JD", c: "from-emerald-500 to-teal-400" },
] as const;

export const STEP_MS = 7000;
