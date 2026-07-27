"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";

export function useLinearConnection() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.linear.getConnection,
    isAuthenticated ? {} : "skip",
  );
  const disconnectMutation = useMutation(api.linear.disconnect);
  const connectAction = useAction(api.linearActions.connectWithApiKey);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connect = useCallback(
    async (apiKey: string) => {
      setIsConnecting(true);
      try {
        const result = await connectAction({ apiKey });
        toast.success(
          result.organizationName
            ? `Linear connected (${result.organizationName})`
            : "Linear connected",
        );
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to connect Linear";
        toast.error(message);
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
      toast.success("Linear disconnected");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect Linear",
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
