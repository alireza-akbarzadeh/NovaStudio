"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";

export function useNotionConnection() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.notion.getConnection,
    isAuthenticated ? {} : "skip",
  );
  const disconnectMutation = useMutation(api.notion.disconnect);
  const connectAction = useAction(api.notionActions.connectWithIntegration);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connect = useCallback(
    async (apiKey: string, parentPageId: string) => {
      setIsConnecting(true);
      try {
        const result = await connectAction({ apiKey, parentPageId });
        toast.success(
          result.parentPageTitle
            ? `Notion connected (${result.parentPageTitle})`
            : "Notion connected",
        );
        return result;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to connect Notion",
        );
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [connectAction],
  );

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectMutation({});
      toast.success("Notion disconnected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect Notion",
      );
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnectMutation]);

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
