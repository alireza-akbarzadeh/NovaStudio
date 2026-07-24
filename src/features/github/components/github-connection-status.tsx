"use client";

import Image from "next/image";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  useConnectGitHub,
  useGitHubConnection,
} from "@/features/github/hooks/use-github-connection";
import { GITHUB_REPO_SCOPE_MESSAGE } from "@/features/github/lib/github-scopes";
import { cn } from "@/lib/utils";

export function GitHubConnectionStatus({ className }: { className?: string }) {
  const { connection, isConnected, hasRepoScope, isLoading, syncError } =
    useGitHubConnection();
  const { connect, isConnecting, isReady } = useConnectGitHub();

  if (isLoading && !isConnecting) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-muted-foreground",
          className,
        )}
      >
        <Loader2Icon className="size-3.5 animate-spin opacity-70" />
        Checking GitHub…
      </span>
    );
  }

  if (isConnected && connection) {
    return (
      <div className={cn("space-y-1", className)}>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Image
            src="/images/github.png"
            alt=""
            width={12}
            height={12}
            className="size-3.5 opacity-70 dark:invert"
          />
          @{connection.username}
        </span>
        {!hasRepoScope ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#c9a227]">
              Repository access required
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={isConnecting}
              onClick={() => void connect()}
              className="h-6 px-2 text-[11px]"
            >
              {isConnecting ? "Authorizing…" : "Grant access"}
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="inline-flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Image
            src="/images/github.png"
            alt=""
            width={12}
            height={12}
            className="size-3.5 opacity-70 dark:invert"
          />
          GitHub not connected
        </span>
        <Button
          type="button"
          size="xs"
          disabled={isConnecting}
          onClick={() => void connect()}
          className="h-7 bg-ws-accent px-2.5 text-[11px] text-white hover:bg-ws-accent-hover"
        >
          {isConnecting ? (
            <>
              <Loader2Icon className="size-3 animate-spin" />
              Connecting…
            </>
          ) : (
            "Connect GitHub"
          )}
        </Button>
      </div>
      {syncError ? (
        <span className="text-[10px] text-destructive">{syncError}</span>
      ) : (
        <span className="text-[10px] text-ws-text-muted">
          {GITHUB_REPO_SCOPE_MESSAGE}
        </span>
      )}
      {!isReady && !isConnecting ? (
        <span className="text-[10px] text-ws-text-muted">
          Waiting for your session to finish loading…
        </span>
      ) : null}
    </div>
  );
}
