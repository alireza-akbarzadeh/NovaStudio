"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { IntegrationId } from "@/features/integrations/lib/integrations-catalog";

export type WebhookIntegrationProvider = Extract<
  IntegrationId,
  "slack" | "discord"
>;

const LABELS: Record<WebhookIntegrationProvider, string> = {
  slack: "Slack",
  discord: "Discord",
};

export function useIntegrationConnection(provider: WebhookIntegrationProvider) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.integrations.getConnection,
    isAuthenticated ? { provider } : "skip",
  );
  const disconnectMutation = useMutation(api.integrations.disconnect);
  const connectAction = useAction(api.integrationActions.connectWebhook);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connect = useCallback(
    async (webhookUrl: string) => {
      setIsConnecting(true);
      try {
        const result = await connectAction({ provider, webhookUrl });
        toast.success(
          result.channelLabel
            ? `${LABELS[provider]} connected (${result.channelLabel})`
            : `${LABELS[provider]} connected`,
        );
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to connect";
        toast.error(message);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [connectAction, provider],
  );

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectMutation({ provider });
      toast.success(`${LABELS[provider]} disconnected`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect",
      );
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnectMutation, provider]);

  return {
    connection: connection ?? null,
    isConnected: Boolean(connection),
    isLoading:
      isAuthLoading || (isAuthenticated && connection === undefined),
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
  };
}
