export type IntegrationId =
  | "github"
  | "slack"
  | "linear"
  | "discord"
  | "vercel"
  | "netlify"
  | "notion"
  | "google-calendar";

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
      "Manage Linear issues in the workspace: list, create, change state, filter by cycle, and sync on push or deploy.",
    category: "Productivity",
    status: "available",
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
    status: "available",
    accent: "from-neutral-700 to-neutral-900",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description:
      "See upcoming meetings in the Calendar hub and create events with Google Meet links.",
    category: "Productivity",
    status: "available",
    accent: "from-[#4285F4] to-[#34A853]",
  },
];
