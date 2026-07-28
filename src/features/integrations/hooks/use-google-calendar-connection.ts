"use client";

import { useReverification, useUser } from "@clerk/nextjs";
import type {
  CreateExternalAccountParams,
  ExternalAccountResource,
  ReauthorizeExternalAccountParams,
} from "@clerk/shared/types";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import {
  GOOGLE_CALENDAR_SCOPES,
  hasGoogleCalendarScope,
} from "@/features/integrations/lib/google-calendar-scopes";

const PENDING_CONNECT_KEY = "polaris:google-calendar-connect-pending";

function getGoogleExternalAccount(user: ReturnType<typeof useUser>["user"]) {
  return user?.externalAccounts.find((account) => account.provider === "google");
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
  return "Failed to connect Google Calendar";
}

function isProviderOAuthUrl(url: URL | string | null | undefined): boolean {
  if (!url) return false;
  const href = typeof url === "string" ? url : url.href;
  try {
    const parsed = new URL(href);
    const host = parsed.hostname;
    return (
      host === "accounts.google.com" ||
      host.endsWith(".google.com") ||
      host.includes("clerk.com") ||
      host.includes("clerk.accounts") ||
      host.endsWith(".clerk.accounts.dev") ||
      host.endsWith(".accounts.dev")
    );
  } catch {
    return false;
  }
}

function redirectToGoogleOAuth(url: URL | string | null | undefined): boolean {
  if (!isProviderOAuthUrl(url)) return false;
  const href = typeof url === "string" ? url : url!.href;
  sessionStorage.setItem(PENDING_CONNECT_KEY, "1");
  window.location.assign(href);
  return true;
}

export function useGoogleCalendarConnection() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const connection = useQuery(
    api.googleCalendar.getConnection,
    isAuthenticated ? {} : "skip",
  );
  const syncConnection = useAction(api.googleCalendarActions.syncConnection);
  const disconnectMutation = useMutation(api.googleCalendar.disconnect);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const hasSyncedForUser = useRef<string | null>(null);
  const handledPendingConnect = useRef(false);

  const googleAccount = getGoogleExternalAccount(user);
  const hasCalendarScope = hasGoogleCalendarScope(googleAccount?.approvedScopes);

  const sync = useCallback(async () => {
    if (!isAuthenticated) {
      return { connected: false as const };
    }

    setIsSyncing(true);
    try {
      return await syncConnection({});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to sync Google Calendar";
      toast.error(message);
      return { connected: false as const };
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated, syncConnection]);

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated || !user?.id) return;
    if (hasSyncedForUser.current === user.id) return;
    hasSyncedForUser.current = user.id;
    void sync();
  }, [isAuthLoading, isAuthenticated, sync, user?.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      hasSyncedForUser.current = null;
    }
  }, [isAuthenticated]);

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
            "email" in result && result.email
              ? `Google Calendar connected (${result.email})`
              : "Google Calendar connected",
          );
        } else {
          const account = getGoogleExternalAccount(user);
          const verifyError = account?.verification?.error?.longMessage;
          toast.error(
            verifyError ||
              "Google linked in Clerk, but Calendar access was not granted. Reconnect and approve Calendar scopes in the Clerk Google connection.",
          );
        }
      } catch (error) {
        toast.error(clerkErrorMessage(error));
      }
    })();
  }, [isAuthenticated, isUserLoaded, sync, user]);

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await disconnectMutation({});
      toast.success("Google Calendar disconnected");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to disconnect Google Calendar",
      );
    } finally {
      setIsDisconnecting(false);
    }
  }, [disconnectMutation]);

  return {
    connection: connection ?? null,
    isConnected: Boolean(connection),
    hasCalendarScope,
    clerkGoogleLinked: Boolean(googleAccount),
    isLoading:
      isAuthLoading ||
      (isAuthenticated && connection === undefined) ||
      isSyncing,
    isDisconnecting,
    sync,
    disconnect,
  };
}

export function useConnectGoogleCalendar() {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const syncConnection = useAction(api.googleCalendarActions.syncConnection);
  const [isConnecting, setIsConnecting] = useState(false);

  const createExternalAccount = useReverification(
    (params: CreateExternalAccountParams) => {
      if (!user) {
        throw new Error("Sign in to connect Google Calendar");
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

  const googleAccount = useMemo(
    () => getGoogleExternalAccount(user),
    [user],
  );

  const connect = useCallback(async () => {
    if (!isLoaded) {
      toast.message("Still loading your account…");
      return;
    }
    if (!user || !isAuthenticated) {
      toast.error("Sign in to connect Google Calendar");
      return;
    }

    setIsConnecting(true);
    try {
      const redirectUrl = window.location.href;
      let existing = getGoogleExternalAccount(user);

      if (
        existing?.verification?.status &&
        existing.verification.status !== "verified"
      ) {
        const pendingUrl = existing.verification.externalVerificationRedirectURL;
        if (isProviderOAuthUrl(pendingUrl) && redirectToGoogleOAuth(pendingUrl)) {
          return;
        }
        if (existing.verification.error?.longMessage) {
          toast.error(existing.verification.error.longMessage);
        }
      }

      await user.reload();
      existing = getGoogleExternalAccount(user);

      if (existing) {
        const needsCalendarScope = !hasGoogleCalendarScope(
          existing.approvedScopes,
        );

        if (needsCalendarScope || existing.verification?.status !== "verified") {
          const account = await reauthorizeExternalAccount(existing, {
            additionalScopes: [...GOOGLE_CALENDAR_SCOPES],
            redirectUrl,
            oidcPrompt: "consent",
          });

          const oauthUrl = account.verification?.externalVerificationRedirectURL;
          if (isProviderOAuthUrl(oauthUrl) && redirectToGoogleOAuth(oauthUrl)) {
            return;
          }

          if (account.verification?.error?.longMessage) {
            throw new Error(account.verification.error.longMessage);
          }
        }

        const result = await syncConnection({});
        if (result.connected) {
          toast.success(
            result.email
              ? `Google Calendar connected (${result.email})`
              : "Google Calendar connected",
          );
        } else {
          toast.error(
            "Clerk has Google linked, but no Calendar token was returned. In Clerk Dashboard → Google, enable custom credentials and add Calendar scopes, then connect again.",
          );
        }
        return;
      }

      const account = await createExternalAccount({
        strategy: "oauth_google",
        redirectUrl,
        additionalScopes: [...GOOGLE_CALENDAR_SCOPES],
        oidcPrompt: "consent",
      });

      const oauthUrl = account.verification?.externalVerificationRedirectURL;
      if (isProviderOAuthUrl(oauthUrl) && redirectToGoogleOAuth(oauthUrl)) {
        return;
      }

      if (account.verification?.error?.longMessage) {
        throw new Error(account.verification.error.longMessage);
      }

      toast.error(
        "Google did not return an authorization URL. Enable the Google social connection in the Clerk Dashboard, then try again.",
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
    isReady: isLoaded && isAuthenticated && Boolean(user),
  };
}
