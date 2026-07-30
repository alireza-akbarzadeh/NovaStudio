/** Curated plugin IDs — must stay in sync with client customize catalog. */

export const MCP_PLUGIN_IDS = ["figma", "datadog"] as const;

export const INTEGRATION_PLUGIN_IDS = [
  "github",
  "slack",
  "linear",
  "discord",
  "vercel",
  "netlify",
  "notion",
  "google-calendar",
] as const;

export const KNOWN_PLUGIN_IDS = [
  ...INTEGRATION_PLUGIN_IDS,
  ...MCP_PLUGIN_IDS,
] as const;

export type KnownPluginId = (typeof KNOWN_PLUGIN_IDS)[number];

const KNOWN_SET = new Set<string>(KNOWN_PLUGIN_IDS);

export function isKnownPluginId(id: string): id is KnownPluginId {
  return KNOWN_SET.has(id);
}
