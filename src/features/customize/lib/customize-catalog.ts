import type { IntegrationId } from "@/features/integrations/lib/integrations-catalog";
import { HUB_INTEGRATIONS } from "@/features/integrations/lib/integrations-catalog";

export type CustomizeCategory =
  | "plugins"
  | "mcps"
  | "skills"
  | "subagents"
  | "rules"
  | "commands"
  | "hooks";

export type CustomizePluginId = IntegrationId | "figma" | "datadog";

export type ConnectKind = "oauth" | "token" | "webhook" | "api-key" | "none";

export type CustomizeItem = {
  id: string;
  name: string;
  description: string;
};

export type CustomizePlugin = {
  id: CustomizePluginId;
  name: string;
  publisher: string;
  description: string;
  connectKind: ConnectKind;
  skills: CustomizeItem[];
  rules: CustomizeItem[];
};

export const CUSTOMIZE_CATEGORIES: {
  id: CustomizeCategory;
  label: string;
}[] = [
  { id: "plugins", label: "Plugins" },
  { id: "mcps", label: "MCPs" },
  { id: "skills", label: "Skills" },
  { id: "subagents", label: "Subagents" },
  { id: "rules", label: "Rules" },
  { id: "commands", label: "Commands" },
  { id: "hooks", label: "Hooks" },
];

const INTEGRATION_SKILLS: Partial<Record<IntegrationId, CustomizeItem[]>> = {
  github: [
    {
      id: "github-sync",
      name: "github-sync",
      description: "Clone, commit, push, and manage branches from the workspace.",
    },
    {
      id: "github-pr",
      name: "github-pr",
      description: "Review and manage pull requests without leaving NovaStudio.",
    },
  ],
  notion: [
    {
      id: "notion-search",
      name: "notion-search",
      description: "Search your Notion workspace for pages and databases.",
    },
    {
      id: "notion-create-page",
      name: "notion-create-page",
      description: "Create Notion pages from workspace content.",
    },
    {
      id: "notion-create-task",
      name: "notion-create-task",
      description: "Create tasks in Notion databases from the editor.",
    },
  ],
  netlify: [
    {
      id: "netlify-ai-gateway",
      name: "netlify-ai-gateway",
      description:
        "Netlify AI Gateway — managed proxy for OpenAI, Anthropic, and Gemini.",
    },
    {
      id: "netlify-blobs",
      name: "netlify-blobs",
      description: "File and asset storage with Netlify Blobs.",
    },
    {
      id: "netlify-deploy",
      name: "netlify-deploy",
      description: "Deploy previews and production builds from the workspace.",
    },
    {
      id: "netlify-config",
      name: "netlify-config",
      description: "netlify.toml — redirects, headers, and build settings.",
    },
  ],
  vercel: [
    {
      id: "vercel-deploy",
      name: "vercel-deploy",
      description: "Deploy preview or production from the Publish menu.",
    },
    {
      id: "vercel-env",
      name: "vercel-env",
      description: "Manage environment variables for Vercel projects.",
    },
  ],
  linear: [
    {
      id: "linear-issues",
      name: "linear-issues",
      description: "List, create, and update Linear issues in the workspace.",
    },
    {
      id: "linear-sync",
      name: "linear-sync",
      description: "Sync issue state on push or deploy.",
    },
  ],
  slack: [
    {
      id: "slack-notify",
      name: "slack-notify",
      description: "Post deploy alerts and AI summaries to Slack channels.",
    },
  ],
  discord: [
    {
      id: "discord-notify",
      name: "discord-notify",
      description: "Notify your community when projects ship.",
    },
  ],
  "google-calendar": [
    {
      id: "google-calendar-events",
      name: "google-calendar-events",
      description: "See upcoming meetings and create events with Meet links.",
    },
  ],
};

const INTEGRATION_RULES: Partial<Record<IntegrationId, CustomizeItem[]>> = {
  github: [
    {
      id: "github-workflow",
      name: "github-workflow",
      description: "Guidelines for Git sync and pull request workflows.",
    },
  ],
  notion: [
    {
      id: "notion-workspace",
      name: "notion-workspace",
      description: "Reference for Notion export and page creation patterns.",
    },
  ],
  netlify: [
    {
      id: "netlify-ai-gateway",
      name: "netlify-ai-gateway",
      description: "Reference for Netlify AI Gateway setup and model routing.",
    },
    {
      id: "netlify-blobs",
      name: "netlify-blobs",
      description: "Guide for Netlify Blobs storage patterns.",
    },
    {
      id: "netlify-config",
      name: "netlify-config",
      description: "Reference for netlify.toml configuration.",
    },
  ],
  vercel: [
    {
      id: "vercel-deploy",
      name: "vercel-deploy",
      description: "Reference for Vercel deployment from NovaStudio.",
    },
  ],
  linear: [
    {
      id: "linear-issues",
      name: "linear-issues",
      description: "Reference for Linear issue management in the workspace.",
    },
  ],
};

const MCP_PLUGINS: CustomizePlugin[] = [
  {
    id: "figma",
    name: "Figma",
    publisher: "Figma",
    description:
      "Design-to-code workflows, component libraries, and Figma file integration.",
    connectKind: "none",
    skills: [
      {
        id: "figma-design-to-code",
        name: "figma-design-to-code",
        description: "Convert Figma designs into production-ready code.",
      },
      {
        id: "figma-use",
        name: "figma-use",
        description: "Read and interact with Figma files from the editor.",
      },
      {
        id: "figma-code-connect",
        name: "figma-code-connect",
        description: "Connect Figma components to your codebase.",
      },
    ],
    rules: [
      {
        id: "figma-design-to-code",
        name: "figma-design-to-code",
        description: "Guidelines for implementing Figma designs in code.",
      },
    ],
  },
  {
    id: "datadog",
    name: "Datadog",
    publisher: "Datadog",
    description:
      "Monitor applications, query metrics, and investigate incidents from NovaStudio.",
    connectKind: "none",
    skills: [
      {
        id: "ddsetup",
        name: "ddsetup",
        description: "Set up Datadog monitoring for your project.",
      },
      {
        id: "ddconfig",
        name: "ddconfig",
        description: "Configure Datadog agents, logs, and APM.",
      },
      {
        id: "ddtoolsets",
        name: "ddtoolsets",
        description: "Use Datadog toolsets for metrics and dashboards.",
      },
    ],
    rules: [
      {
        id: "ddsetup",
        name: "ddsetup",
        description: "Reference for Datadog setup and configuration.",
      },
    ],
  },
];

const CONNECT_KIND_BY_INTEGRATION: Record<IntegrationId, ConnectKind> = {
  github: "oauth",
  "google-calendar": "oauth",
  notion: "api-key",
  linear: "api-key",
  vercel: "token",
  netlify: "token",
  slack: "webhook",
  discord: "webhook",
};

function integrationPlugin(meta: (typeof HUB_INTEGRATIONS)[number]): CustomizePlugin {
  return {
    id: meta.id,
    name: meta.name,
    publisher: meta.name,
    description: meta.description,
    connectKind: CONNECT_KIND_BY_INTEGRATION[meta.id],
    skills: INTEGRATION_SKILLS[meta.id] ?? [],
    rules: INTEGRATION_RULES[meta.id] ?? [],
  };
}

export const CUSTOMIZE_PLUGINS: CustomizePlugin[] = [
  ...HUB_INTEGRATIONS.map(integrationPlugin),
  ...MCP_PLUGINS,
];

export function getCustomizePlugin(id: string): CustomizePlugin | undefined {
  return CUSTOMIZE_PLUGINS.find((plugin) => plugin.id === id);
}

export function isMcpPlugin(plugin: CustomizePlugin): boolean {
  return plugin.connectKind === "none";
}

export function pluginNeedsConnect(plugin: CustomizePlugin): boolean {
  return plugin.connectKind !== "none";
}

export function getInstalledPluginItems(
  installedIds: Set<string>,
  kind: "skills" | "rules",
): Array<CustomizeItem & { pluginId: CustomizePluginId; pluginName: string }> {
  const items: Array<
    CustomizeItem & { pluginId: CustomizePluginId; pluginName: string }
  > = [];

  for (const plugin of CUSTOMIZE_PLUGINS) {
    if (!installedIds.has(plugin.id)) continue;
    for (const item of plugin[kind]) {
      items.push({
        ...item,
        pluginId: plugin.id,
        pluginName: plugin.name,
      });
    }
  }

  return items;
}

export function getMcpPlugins(): CustomizePlugin[] {
  return CUSTOMIZE_PLUGINS.filter(isMcpPlugin);
}
