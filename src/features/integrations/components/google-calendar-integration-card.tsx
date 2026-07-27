"use client";

import { CalendarDaysIcon, Loader2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useConnectGoogleCalendar,
  useGoogleCalendarConnection,
} from "@/features/integrations/hooks/use-google-calendar-connection";
import type { IntegrationMeta } from "@/features/integrations/lib/integrations-catalog";
import { cn } from "@/lib/utils";

type GoogleCalendarIntegrationCardProps = {
  integration: IntegrationMeta;
};

export function GoogleCalendarIntegrationCard({
  integration,
}: GoogleCalendarIntegrationCardProps) {
  const {
    connection,
    isConnected,
    isLoading,
    isDisconnecting,
    hasCalendarScope,
    disconnect,
  } = useGoogleCalendarConnection();
  const { connect, isConnecting } = useConnectGoogleCalendar();

  return (
    <article className="group flex flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/80 shadow-[0_16px_48px_-32px_rgba(66,133,244,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(66,133,244,0.45)]">
      <div className={cn("relative h-28 bg-gradient-to-br", integration.accent)}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute right-4 bottom-4 inline-flex size-12 items-center justify-center rounded-2xl bg-black/30 backdrop-blur">
          <CalendarDaysIcon className="size-6 text-white" strokeWidth={1.75} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight">
              {integration.name}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {integration.category}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full",
              isConnected && "bg-emerald-500/15 text-emerald-600",
            )}
          >
            {isLoading ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : isConnected ? (
              "Connected"
            ) : (
              "Available"
            )}
          </Badge>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {integration.description}
        </p>

        {isConnected && connection ? (
          <p className="text-[11px] text-muted-foreground">
            {connection.displayName
              ? `${connection.displayName} · ${connection.email}`
              : connection.email}
            {!hasCalendarScope
              ? " · reconnect to grant Calendar permission"
              : null}
          </p>
        ) : null}

        <div className="mt-auto flex gap-2 pt-2">
          {isConnected && hasCalendarScope ? (
            <Button
              variant="outline"
              className="w-full rounded-xl"
              disabled={isDisconnecting}
              onClick={() => void disconnect()}
            >
              {isDisconnecting ? "Disconnecting…" : "Disconnect"}
            </Button>
          ) : (
            <Button
              className="w-full rounded-xl"
              disabled={isConnecting || isLoading}
              onClick={() => void connect()}
            >
              {isConnecting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Connecting…
                </>
              ) : isConnected ? (
                "Grant Calendar access"
              ) : (
                `Connect ${integration.name}`
              )}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
