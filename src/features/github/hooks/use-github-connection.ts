"use client";

import { useUser, useReverification } from "@clerk/nextjs";
import type {
  CreateExternalAccountParams,
  ExternalAccountResource,
  ReauthorizeExternalAccountParams,
} from "@clerk/shared/types";
import { useAction, useConvexAuth } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import {
  GITHUB_REPO_SCOPES,
  hasGitHubRepoScope,
} from "@/features/github/lib/github-scopes";

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
    const first = (error as { errors: Array<{ longMessage?: string; message?: string }> })
      .errors[0];
    if (first?.longMessage) return first.longMessage;
    if (first?.message) return first.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Failed to connect GitHub";
}

function redirectToVerification(url: URL | string | null | undefined): boolean {
  if (!url) return false;
  const href = typeof url === "string" ? url : url.href;
  if (!href) return false;
  window.location.assign(href);
  return true;
}

export function useGitHubConnection() {
  const { user } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.github.getConnection,
    isAuthenticated ? {} : "skip",
  );
  const syncConnection = useAction(api.githubActions.syncConnection);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSyncedForUser = useRef<string | null>(null);

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

  // After returning from GitHub OAuth, re-sync once the tab is focused.
  useEffect(() => {
    if (!isAuthenticated) return;

    const onFocus = () => {
      hasSyncedForUser.current = null;
      void sync();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated, sync]);

  return {
    connection: connection ?? null,
    isConnected: Boolean(connection),
    hasRepoScope,
    isLoading:
      isAuthLoading ||
      (isAuthenticated && connection === undefined) ||
      isSyncing,
    syncError,
    sync,
  };
}

// Need useQuery import - I removed it by accident in the write. Fix below.
import { useQuery } from "convex/react";

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
      const existing = getGitHubExternalAccount(user);
      const returnUrl = window.location.href;

      // Incomplete prior attempt — resume verification.
      if (
        existing?.verification?.status &&
        existing.verification.status !== "verified" &&
        existing.verification.externalVerificationRedirectURL
      ) {
        if (
          redirectToVerification(
            existing.verification.externalVerificationRedirectURL,
          )
        ) {
          return;
        }
      }

      if (existing) {
        const account = await reauthorizeExternalAccount(existing, {
          additionalScopes: [...GITHUB_REPO_SCOPES],
          redirectUrl: returnUrl,
        });
        if (
          redirectToVerification(
            account.verification?.externalVerificationRedirectURL,
          )
        ) {
          return;
        }
      } else {
        const account = await createExternalAccount({
          strategy: "oauth_github",
          redirectUrl: returnUrl,
          additionalScopes: [...GITHUB_REPO_SCOPES],
        });
        if (
          redirectToVerification(
            account.verification?.externalVerificationRedirectURL,
          )
        ) {
          return;
        }
      }

      const result = await syncConnection({});
      if (result.connected) {
        toast.success(
          result.username
            ? `Connected as @${result.username}`
            : "GitHub connected",
        );
      } else {
        toast.error(
          "GitHub authorization did not finish. Try Connect again and approve repository access.",
        );
      }
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
  const [isCloning, setIsCloning] = useState(false);

  const clone = useCallback(
    async (args: { repoUrl: string; branch?: string; name?: string }) => {
      setIsCloning(true);
      try {
        return await cloneFromGitHub(args);
      } finally {
        setIsCloning(false);
      }
    },
    [cloneFromGitHub],
  );

  return { clone, isCloning };
}
