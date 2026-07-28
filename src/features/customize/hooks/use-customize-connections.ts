"use client";

import { useMemo } from "react";

import type { CustomizePluginId } from "@/features/customize/lib/customize-catalog";
import { useDeployConnection } from "@/features/deploy/hooks/use-deploy-connection";
import { useGitHubConnection } from "@/features/github/hooks/use-github-connection";
import { useGoogleCalendarConnection } from "@/features/integrations/hooks/use-google-calendar-connection";
import { useIntegrationConnection } from "@/features/integrations/hooks/use-integration-connection";
import { useLinearConnection } from "@/features/integrations/hooks/use-linear-connection";
import { useNotionConnection } from "@/features/integrations/hooks/use-notion-connection";

export type PluginConnectionState = {
  isConnected: boolean;
  isLoading: boolean;
};

/** Account connection status for all customize plugins (user-level). */
export function useCustomizeConnections() {
  const github = useGitHubConnection();
  const notion = useNotionConnection();
  const linear = useLinearConnection();
  const netlify = useDeployConnection("netlify");
  const vercel = useDeployConnection("vercel");
  const slack = useIntegrationConnection("slack");
  const discord = useIntegrationConnection("discord");
  const googleCalendar = useGoogleCalendarConnection();

  return useMemo(() => {
    const map = new Map<CustomizePluginId, PluginConnectionState>();

    const set = (id: CustomizePluginId, state: PluginConnectionState) => {
      map.set(id, state);
    };

    set("github", {
      isConnected: github.isConnected,
      isLoading: github.isLoading,
    });
    set("notion", {
      isConnected: notion.isConnected,
      isLoading: notion.isLoading,
    });
    set("linear", {
      isConnected: linear.isConnected,
      isLoading: linear.isLoading,
    });
    set("netlify", {
      isConnected: netlify.isConnected,
      isLoading: netlify.isLoading,
    });
    set("vercel", {
      isConnected: vercel.isConnected,
      isLoading: vercel.isLoading,
    });
    set("slack", {
      isConnected: slack.isConnected,
      isLoading: slack.isLoading,
    });
    set("discord", {
      isConnected: discord.isConnected,
      isLoading: discord.isLoading,
    });
    set("google-calendar", {
      isConnected: googleCalendar.isConnected,
      isLoading: googleCalendar.isLoading,
    });
    set("figma", { isConnected: true, isLoading: false });
    set("datadog", { isConnected: true, isLoading: false });

    return map;
  }, [
    discord.isConnected,
    discord.isLoading,
    github.isConnected,
    github.isLoading,
    googleCalendar.isConnected,
    googleCalendar.isLoading,
    linear.isConnected,
    linear.isLoading,
    netlify.isConnected,
    netlify.isLoading,
    notion.isConnected,
    notion.isLoading,
    slack.isConnected,
    slack.isLoading,
    vercel.isConnected,
    vercel.isLoading,
  ]);
}

export function usePluginConnection(pluginId: CustomizePluginId) {
  const connections = useCustomizeConnections();
  return (
    connections.get(pluginId) ?? { isConnected: false, isLoading: false }
  );
}

/** Prefer this inside Customize views to avoid duplicate connection subscriptions. */
export { usePluginConnectionFromContext } from "@/features/customize/components/customize-connections-provider";
