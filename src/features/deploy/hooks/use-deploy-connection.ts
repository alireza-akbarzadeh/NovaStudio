"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type DeployProvider = "vercel" | "netlify";

export function useDeployConnection(provider: DeployProvider) {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.deploy.getConnection,
    isAuthenticated ? { provider } : "skip",
  );
  const disconnectMutation = useMutation(api.deploy.disconnect);
  const connectAction = useAction(api.deployActions.connectWithToken);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connect = useCallback(
    async (accessToken: string, teamId?: string) => {
      setIsConnecting(true);
      try {
        const result = await connectAction({
          provider,
          accessToken,
          teamId: teamId?.trim() || undefined,
        });
        toast.success(
          result.accountName
            ? `Connected ${provider === "vercel" ? "Vercel" : "Netlify"} as ${result.accountName}`
            : `${provider === "vercel" ? "Vercel" : "Netlify"} connected`,
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
      toast.success(
        `${provider === "vercel" ? "Vercel" : "Netlify"} disconnected`,
      );
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

export function useDeployProject(projectId: string) {
  const deployAction = useAction(api.deployActions.deployProject);
  const [deployingProvider, setDeployingProvider] =
    useState<DeployProvider | null>(null);

  const deploy = useCallback(
    async (
      provider: DeployProvider,
      target: "preview" | "production" = "production",
    ) => {
      setDeployingProvider(provider);
      try {
        const result = await deployAction({
          projectId: projectId as Id<"projects">,
          provider,
          target,
        });

        if (!result.ok) {
          if (result.reason === "not_connected") {
            toast.message(
              `Connect ${provider === "vercel" ? "Vercel" : "Netlify"} first`,
              {
                description: "Open Integrations to paste a personal access token.",
                action: result.importUrl
                  ? {
                      label: "Open provider",
                      onClick: () =>
                        window.open(result.importUrl, "_blank", "noopener"),
                    }
                  : undefined,
              },
            );
            return result;
          }

          toast.error(result.message || "Deploy failed", {
            action: result.importUrl
              ? {
                  label: "Open provider UI",
                  onClick: () =>
                    window.open(result.importUrl, "_blank", "noopener"),
                }
              : undefined,
          });
          return result;
        }

        if ("needsManualLink" in result && result.needsManualLink) {
          toast.message("Netlify site created — finish GitHub linking", {
            description: "Open Netlify to connect the repo, then redeploy.",
            action: result.importUrl
              ? {
                  label: "Open Netlify",
                  onClick: () =>
                    window.open(result.importUrl, "_blank", "noopener"),
                }
              : result.inspectorUrl
                ? {
                    label: "Open site",
                    onClick: () =>
                      window.open(result.inspectorUrl, "_blank", "noopener"),
                  }
                : undefined,
          });
          return result;
        }

        toast.success(
          `${provider === "vercel" ? "Vercel" : "Netlify"} deploy started`,
          {
            description: result.url ?? result.status,
            action: result.url
              ? {
                  label: "Open",
                  onClick: () => window.open(result.url, "_blank", "noopener"),
                }
              : result.inspectorUrl
                ? {
                    label: "Inspect",
                    onClick: () =>
                      window.open(result.inspectorUrl, "_blank", "noopener"),
                  }
                : undefined,
          },
        );
        return result;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Deploy failed");
        throw error;
      } finally {
        setDeployingProvider(null);
      }
    },
    [deployAction, projectId],
  );

  return {
    deploy,
    deployingProvider,
    isDeploying: deployingProvider !== null,
  };
}
