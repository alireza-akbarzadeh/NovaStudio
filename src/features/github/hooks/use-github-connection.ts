"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import type {
  CreateExternalAccountParams,
  ExternalAccountResource,
  ReauthorizeExternalAccountParams,
} from "@clerk/shared/types";
import { useAction, useConvexAuth, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  GITHUB_REPO_SCOPES,
  hasGitHubRepoScope,
} from "@/features/github/lib/github-scopes";

const PENDING_CONNECT_KEY = "polaris:github-connect-pending";

function getGitHubExternalAccount(user: ReturnType<typeof useUser>["user"]) {
  return user?.externalAccounts.find((account) => account.provider === "github");
}

function clerkErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray((error as { errors: unknown[] }).errors)
  ) {
    const first = (
      error as { errors: Array<{ longMessage?: string; message?: string }> }
    ).errors[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Failed to connect GitHub";
}

function isProviderOAuthUrl(url: URL | string | null | undefined): boolean {
  if (!url) return false;
  const href = typeof url === "string" ? url : url.href;
  try {
    const parsed = new URL(href);
    const host = parsed.hostname;
    return (
      host === "github.com" ||
      host.endsWith(".github.com") ||
      host.includes("clerk.com") ||
      host.includes("clerk.accounts") ||
      host.endsWith(".clerk.accounts.dev") ||
      host.endsWith(".accounts.dev")
    );
  } catch {
    return false;
  }
}

function redirectToGitHubOAuth(url: URL | string | null | undefined): boolean {
  if (!isProviderOAuthUrl(url)) return false;
  const href = typeof url === "string" ? url : url!.href;
  sessionStorage.setItem(PENDING_CONNECT_KEY, "1");
  window.location.assign(href);
  return true;
}

export function useGitHubConnection() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.github.getConnection,
    isAuthenticated ? {} : "skip",
  );
  const syncConnection = useAction(api.githubActions.syncConnection);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSyncedForUser = useRef<string | null>(null);
  const handledPendingConnect = useRef(false);

  const githubAccount = getGitHubExternalAccount(user);
  const hasRepoScope = hasGitHubRepoScope(githubAccount?.approvedScopes);

  const sync = useCallback(async () => {
    if (!isAuthenticated) {
      return { connected: false as const };
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      return await syncConnection({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sync GitHub";
      setSyncError(message);
      return { connected: false as const };
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, syncConnection]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user?.id) {
      return;
    }
    if (hasSyncedForUser.current === user.id) {
      return;
    }
    hasSyncedForUser.current = user.id;
    void sync();
  }, [isAuthLoading, isAuthenticated, sync, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedForUser.current = null;
    }
  }, [isAuthenticated]);

  // After returning from GitHub OAuth, finish sync + show result.
  useEffect(() => {
    if (!isUserLoaded || !isAuthenticated || !user) return;
    if (handledPendingConnect.current) return;
    if (sessionStorage.getItem(PENDING_CONNECT_KEY) !== "1") return;

    handledPendingConnect.current = true;
    sessionStorage.removeItem(PENDING_CONNECT_KEY);

    void (async () => {
      try {
        await user.reload();
        const result = await sync();
        if (result.connected) {
          toast.success(
            "username" in result && result.username
              ? `Connected as @${result.username}`
              : "GitHub connected",
          );
        } else {
          const account = getGitHubExternalAccount(user);
          const verifyError = account?.verification?.error?.longMessage;
          toast.error(
            verifyError ||
              "GitHub connected in Clerk, but Polaris could not read a repo token. Reconnect and approve the “repo” permission (enable GitHub with custom credentials + repo scope in the Clerk Dashboard).",
          );
        }
      } catch (error) {
        toast.error(clerkErrorMessage(error));
      }
    })();
  }, [isAuthenticated, isUserLoaded, sync, user]);

  return {
    connection: connection ?? null,
    isConnected: Boolean(connection),
    hasRepoScope,
    clerkGitHubLinked: Boolean(githubAccount),
    isLoading:
      isAuthLoading ||
      (isAuthenticated && connection === undefined) ||
      isSyncing,
    syncError,
    sync,
  };
}

export function useConnectGitHub() {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const syncConnection = useAction(api.githubActions.syncConnection);
  const [isConnecting, setIsConnecting] = useState(false);

  const createExternalAccount = useReverification(
    (params: CreateExternalAccountParams) => {
      if (!user) {
        throw new Error("Sign in to connect GitHub");
      }
      return user.createExternalAccount(params);
    },
  );

  const reauthorizeExternalAccount = useReverification(
    (
      account: ExternalAccountResource,
      params: ReauthorizeExternalAccountParams,
    ) => account.reauthorize(params),
  );

  const githubAccount = useMemo(
    () => getGitHubExternalAccount(user),
    [user],
  );
  const hasRepoScope = hasGitHubRepoScope(githubAccount?.approvedScopes);

  const connect = useCallback(async () => {
    if (!isLoaded) {
      toast.message("Still loading your account…");
      return;
    }
    if (!user || !isAuthenticated) {
      toast.error("Sign in to connect GitHub");
      return;
    }

    setIsConnecting(true);
    try {
      // Return to this exact page after GitHub — do NOT use /sso-callback
      // (that route is for sign-in OAuth and will bounce immediately).
      const redirectUrl = window.location.href;
      let existing = getGitHubExternalAccount(user);

      // Resume incomplete verification first.
      if (
        existing?.verification?.status &&
        existing.verification.status !== "verified"
      ) {
        const pendingUrl = existing.verification.externalVerificationRedirectURL;
        if (isProviderOAuthUrl(pendingUrl) && redirectToGitHubOAuth(pendingUrl)) {
          return;
        }
        if (existing.verification.error?.longMessage) {
          toast.error(existing.verification.error.longMessage);
        }
      }

      // Fresh Clerk user data before deciding create vs reauthorize.
      await user.reload();
      existing = getGitHubExternalAccount(user);

      if (existing) {
        const needsRepoScope = !hasGitHubRepoScope(existing.approvedScopes);

        if (needsRepoScope || existing.verification?.status !== "verified") {
          const account = await reauthorizeExternalAccount(existing, {
            additionalScopes: [...GITHUB_REPO_SCOPES],
            redirectUrl,
            // Force GitHub to show the consent screen for `repo`.
            oidcPrompt: "consent",
          });

          const oauthUrl = account.verification?.externalVerificationRedirectURL;
          if (isProviderOAuthUrl(oauthUrl) && redirectToGitHubOAuth(oauthUrl)) {
            return;
          }

          if (account.verification?.error?.longMessage) {
            throw new Error(account.verification.error.longMessage);
          }
        }

        // Already linked in Clerk — just sync the Convex connection.
        const result = await syncConnection({});
        if (result.connected) {
          toast.success(
            result.username
              ? `Connected as @${result.username}`
              : "GitHub connected",
          );
        } else {
          toast.error(
            "Clerk has GitHub linked, but no access token was returned. In Clerk Dashboard → GitHub social connection, enable custom credentials and add the `repo` scope, then click Connect again.",
          );
        }
        return;
      }

      const account = await createExternalAccount({
        strategy: "oauth_github",
        redirectUrl,
        additionalScopes: [...GITHUB_REPO_SCOPES],
        oidcPrompt: "consent",
      });

      const oauthUrl = account.verification?.externalVerificationRedirectURL;
      if (isProviderOAuthUrl(oauthUrl) && redirectToGitHubOAuth(oauthUrl)) {
        return;
      }

      if (account.verification?.error?.longMessage) {
        throw new Error(account.verification.error.longMessage);
      }

      toast.error(
        "GitHub did not return an authorization URL. Enable the GitHub social connection in the Clerk Dashboard, then try again.",
      );
    } catch (error) {
      toast.error(clerkErrorMessage(error));
    } finally {
      setIsConnecting(false);
    }
  }, [
    createExternalAccount,
    isAuthenticated,
    isLoaded,
    reauthorizeExternalAccount,
    syncConnection,
    user,
  ]);

  return {
    connect,
    isConnecting,
    hasRepoScope,
    isReady: isLoaded && isAuthenticated && Boolean(user),
  };
}

export function useCloneFromGitHub() {
  const cloneFromGitHub = useAction(api.githubImport.cloneFromGitHub);
  const processCloneJob = useAction(api.githubImport.processCloneJob);
  const [isCloning, setIsCloning] = useState(false);

  const clone = useCallback(
    async (args: { repoUrl: string; branch?: string; name?: string }) => {
      setIsCloning(true);
      try {
        // Project is created first — import runs in the background after this.
        const { projectId, importJobToken } = await cloneFromGitHub(args);

        // Best-effort queue. Never fail the UI once the project exists.
        await enqueueCloneJob({
          projectId,
          jobToken: importJobToken,
          processCloneJob,
        });

        return projectId;
      } finally {
        setIsCloning(false);
      }
    },
    [cloneFromGitHub, processCloneJob],
  );

  return { clone, isCloning };
}

/**
 * Prefer Inngest via `/api/github/clone`. If that request fails (common
 * "Failed to fetch" in local/dev), fall back to the Convex import action so
 * cloning still completes without an error toast.
 */
async function enqueueCloneJob(args: {
  projectId: string;
  jobToken: string;
  processCloneJob: (args: {
    projectId: Id<"projects">;
    jobToken: string;
  }) => Promise<unknown>;
}) {
  const { projectId, jobToken, processCloneJob } = args;

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch("/api/github/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, jobToken }),
        signal: controller.signal,
      });
      if (response.ok) return;
    } finally {
      window.clearTimeout(timeout);
    }
  } catch {
    // Network / abort — fall through to Convex.
  }

  // Fire-and-forget so the dialog can close immediately.
  void processCloneJob({
    projectId: projectId as Id<"projects">,
    jobToken,
  }).catch(() => {
    // processCloneJob marks the project failed on its own.
  });
}
