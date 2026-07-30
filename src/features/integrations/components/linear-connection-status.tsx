"use client";

import { KanbanSquareIcon, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LinearConnectForm } from "@/features/integrations/components/linear-connect-form";
import { useLinearConnection } from "@/features/integrations/hooks/use-linear-connection";
import { cn } from "@/lib/utils";

type LinearConnectionStatusProps = {
  className?: string;
  compact?: boolean;
  /** When true, render nothing if connected. */
  hideWhenHealthy?: boolean;
};

export function LinearConnectionStatus({
  className,
  compact = false,
  hideWhenHealthy = false,
}: LinearConnectionStatusProps) {
  const {
    connection,
    isConnected,
    isLoading,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
  } = useLinearConnection();

  if (isLoading && !isConnecting) {
    if (hideWhenHealthy) return null;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-ws-text-muted",
          className,
        )}
      >
        <Loader2Icon className="size-3.5 animate-spin opacity-70" />
        Checking Linear…
      </span>
    );
  }

  if (isConnected && connection) {
    if (hideWhenHealthy) return null;
    return (
      <div className={cn("space-y-1.5", className)}>
        <span className="inline-flex items-center gap-1.5 text-ws-text-secondary">
          <KanbanSquareIcon className="size-3.5 text-ws-text-muted" />
          {connection.viewerName
            ? connection.viewerName
            : "Linear connected"}
          {connection.organizationName
            ? ` · ${connection.organizationName}`
            : null}
        </span>
        {!hideWhenHealthy ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={isDisconnecting}
            onClick={() => void disconnect()}
            className="h-6 px-2 text-[10px] text-ws-text-muted hover:text-ws-text"
          >
            {isDisconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="inline-flex items-center gap-1.5 text-ws-text-muted">
        <KanbanSquareIcon className="size-3.5 opacity-70" />
        <span className={compact ? "text-[11px]" : "text-[12px]"}>
          Linear not connected
        </span>
      </div>
      {!compact ? (
        <p className="text-[11px] leading-relaxed text-ws-text-muted">
          Paste a personal API key to create tasks, assign teammates, and sync
          status on push or deploy.
        </p>
      ) : null}
      <LinearConnectForm
        onConnect={connect}
        isConnecting={isConnecting}
        compact={compact}
      />
    </div>
  );
}
