"use client";

import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectDeployDialog } from "@/features/deploy/components/connect-deploy-dialog";
import {
  useDeployConnection,
  type DeployProvider,
} from "@/features/deploy/hooks/use-deploy-connection";
import type { IntegrationMeta } from "@/features/integrations/lib/integrations-catalog";
import { cn } from "@/lib/utils";

type DeployIntegrationCardProps = {
  integration: IntegrationMeta;
  provider: DeployProvider;
  logoSrc: string;
  logoClassName?: string;
};

export function DeployIntegrationCard({
  integration,
  provider,
  logoSrc,
  logoClassName,
}: DeployIntegrationCardProps) {
  const {
    connection,
    isConnected,
    isLoading,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
  } = useDeployConnection(provider);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-[22px] border border-border/60 bg-card/80 shadow-[0_16px_48px_-32px_rgba(76,29,149,0.45)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-30px_rgba(76,29,149,0.55)]">
        <div
          className={cn("relative h-28 bg-gradient-to-br", integration.accent)}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_55%)]" />
          <div className="absolute right-4 bottom-4 inline-flex size-12 items-center justify-center rounded-2xl bg-black/30 backdrop-blur">
            <Image
              src={logoSrc}
              alt=""
              width={24}
              height={24}
              className={cn("size-6", logoClassName)}
            />
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
              Signed in as {connection.accountName}
              {connection.accountSlug ? ` (@${connection.accountSlug})` : null}
            </p>
          ) : null}

          <div className="mt-auto flex gap-2 pt-2">
            {isConnected ? (
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
                disabled={isConnecting}
                onClick={() => setDialogOpen(true)}
              >
                Connect {integration.name}
              </Button>
            )}
          </div>
        </div>
      </article>

      <ConnectDeployDialog
        provider={provider}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnect={connect}
        isConnecting={isConnecting}
      />
    </>
  );
}
