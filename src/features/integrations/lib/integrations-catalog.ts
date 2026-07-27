export type IntegrationId =
  | "github"
  | "slack"
  | "linear"
  | "discord"
  | "vercel"
  | "netlify"
  | "notion";

export type IntegrationStatus = "connected" | "available" | "coming-soon";

export type IntegrationMeta = {
  id: IntegrationId;
  name: string;
  description: string;
  category: "Source" | "Communication" | "Productivity" | "Deploy";
  status: IntegrationStatus;
  accent: string;
};

export const HUB_INTEGRATIONS: IntegrationMeta[] = [
  {
    id: "github",
    name: "GitHub",
    description:
      "Clone repos, sync branches, commit and push from your NovaStudio workspace.",
    category: "Source",
    status: "available",
    accent: "from-zinc-700 to-zinc-900",
  },
  {
    id: "slack",
    name: "Slack",
    description:
      "Post deploy alerts, AI summaries, and invite links into your team channels.",
    category: "Communication",
    status: "available",
    accent: "from-[#4A154B] to-[#611f69]",
  },
  {
    id: "linear",
    name: "Linear",
    description:
      "Link issues to projects and sync status when PRs merge from NovaStudio.",
    category: "Productivity",
    status: "coming-soon",
    accent: "from-indigo-600 to-violet-700",
  },
  {
    id: "discord",
    name: "Discord",
    description:
      "Notify your community when public projects ship or request access.",
    category: "Communication",
    status: "available",
    accent: "from-[#5865F2] to-[#404EED]",
  },
  {
    id: "vercel",
    name: "Vercel",
    description:
      "Connect a token and deploy preview or production from the workspace Publish menu.",
    category: "Deploy",
    status: "available",
    accent: "from-neutral-800 to-black",
  },
  {
    id: "netlify",
    name: "Netlify",
    description:
      "Connect a token and trigger Netlify builds for GitHub-linked projects.",
    category: "Deploy",
    status: "available",
    accent: "from-[#013654] to-[#00AD9F]",
  },
  {
    id: "notion",
    name: "Notion",
    description:
      "Export docs, specs, and AI plans into Notion pages your team already uses.",
    category: "Productivity",
    status: "coming-soon",
    accent: "from-neutral-700 to-neutral-900",
  },
];
