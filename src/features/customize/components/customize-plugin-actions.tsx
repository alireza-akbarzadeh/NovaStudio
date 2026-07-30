"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConnectDeployDialog } from "@/features/deploy/components/connect-deploy-dialog";
import { useDeployConnection } from "@/features/deploy/hooks/use-deploy-connection";
import type { CustomizePlugin } from "@/features/customize/lib/customize-catalog";
import { pluginNeedsConnect } from "@/features/customize/lib/customize-catalog";
import { usePluginConnection } from "@/features/customize/hooks/use-customize-connections";
import { useUserPlugins } from "@/features/customize/hooks/use-user-plugins";
import {
  useConnectGitHub,
  useGitHubConnection,
} from "@/features/github/hooks/use-github-connection";
import { ConnectLinearDialog } from "@/features/integrations/components/connect-linear-dialog";
import { ConnectNotionDialog } from "@/features/integrations/components/connect-notion-dialog";
import { ConnectWebhookDialog } from "@/features/integrations/components/connect-webhook-dialog";
import {
  useConnectGoogleCalendar,
  useGoogleCalendarConnection,
} from "@/features/integrations/hooks/use-google-calendar-connection";
import { useIntegrationConnection } from "@/features/integrations/hooks/use-integration-connection";
import { useLinearConnection } from "@/features/integrations/hooks/use-linear-connection";
import { useNotionConnection } from "@/features/integrations/hooks/use-notion-connection";
import { cn } from "@/lib/utils";

type CustomizePluginActionsProps = {
  plugin: CustomizePlugin;
  onTryInChat?: () => void;
  className?: string;
  compact?: boolean;
};

export function CustomizePluginActions({
  plugin,
  onTryInChat,
  className,
  compact = false,
}: CustomizePluginActionsProps) {
  const { installedIds, install, uninstall } = useUserPlugins();
  const { isConnected, isLoading: connectionLoading } = usePluginConnection(
    plugin.id,
  );
  const isInstalled = installedIds.has(plugin.id);
  const needsConnect = pluginNeedsConnect(plugin);

  const [notionOpen, setNotionOpen] = useState(false);
  const [linearOpen, setLinearOpen] = useState(false);
  const [deployOpen, setDeployOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);

  const notion = useNotionConnection();
  const linear = useLinearConnection();
  const netlify = useDeployConnection("netlify");
  const vercel = useDeployConnection("vercel");
  const slack = useIntegrationConnection("slack");
  const discord = useIntegrationConnection("discord");
  const github = useGitHubConnection();
  const { connect: connectGitHub, isConnecting: isConnectingGitHub } =
    useConnectGitHub();
  const googleCalendar = useGoogleCalendarConnection();
  const { connect: connectGoogleCalendar, isConnecting: isConnectingGoogle } =
    useConnectGoogleCalendar();

  const deploy =
    plugin.id === "netlify"
      ? netlify
      : plugin.id === "vercel"
        ? vercel
        : null;

  const webhook =
    plugin.id === "slack"
      ? slack
      : plugin.id === "discord"
        ? discord
        : null;

  const openConnect = () => {
    switch (plugin.connectKind) {
      case "api-key":
        if (plugin.id === "notion") setNotionOpen(true);
        if (plugin.id === "linear") setLinearOpen(true);
        break;
      case "token":
        setDeployOpen(true);
        break;
      case "webhook":
        setWebhookOpen(true);
        break;
      case "oauth":
        if (plugin.id === "github") void connectGitHub();
        if (plugin.id === "google-calendar") void connectGoogleCalendar();
        break;
      default:
        break;
    }
  };

  const disconnect = () => {
    switch (plugin.id) {
      case "notion":
        void notion.disconnect();
        break;
      case "linear":
        void linear.disconnect();
        break;
      case "netlify":
        void netlify.disconnect();
        break;
      case "vercel":
        void vercel.disconnect();
        break;
      case "slack":
        void slack.disconnect();
        break;
      case "discord":
        void discord.disconnect();
        break;
      case "google-calendar":
        void googleCalendar.disconnect();
        break;
      default:
        break;
    }
  };

  const isConnecting =
    notion.isConnecting ||
    linear.isConnecting ||
    (deploy?.isConnecting ?? false) ||
    (webhook?.isConnecting ?? false) ||
    isConnectingGitHub ||
    isConnectingGoogle;

  const isDisconnecting =
    notion.isDisconnecting ||
    linear.isDisconnecting ||
    (deploy?.isDisconnecting ?? false) ||
    (webhook?.isDisconnecting ?? false) ||
    googleCalendar.isDisconnecting;

  const canTryInChat = isInstalled && (!needsConnect || isConnected);
  const btnClass = compact
    ? "h-7 rounded-full px-2.5 text-[10px]"
    : "h-8 rounded-full px-3 text-[11px]";

  return (
    <>
      <div className={cn("flex shrink-0 flex-wrap items-center gap-1.5", className)}>
        {isInstalled ? (
          <button
            type="button"
            className="text-[11px] text-ws-text-muted hover:text-ws-text"
            onClick={() => void uninstall(plugin.id)}
          >
            Uninstall
          </button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(btnClass, "border-ws-border-subtle bg-transparent")}
            onClick={() => void install(plugin.id)}
          >
            Install
          </Button>
        )}

        {needsConnect ? (
          isConnected ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisconnecting}
              className={cn(btnClass, "border-ws-border-subtle bg-transparent")}
              onClick={disconnect}
            >
              {isDisconnecting ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                "Disconnect"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isConnecting || connectionLoading}
              className={cn(
                btnClass,
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15",
              )}
              onClick={(event) => {
                event.stopPropagation();
                openConnect();
              }}
            >
              {isConnecting || connectionLoading ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                "Connect"
              )}
            </Button>
          )
        ) : null}

        {plugin.id === "github" && github.isConnected && !github.hasRepoScope ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(btnClass, "border-amber-500/40 text-amber-400")}
            disabled={isConnectingGitHub}
            onClick={() => void connectGitHub()}
          >
            Grant repo access
          </Button>
        ) : null}

        {!compact ? (
          <Button
            type="button"
            size="sm"
            disabled={!canTryInChat}
            className={cn(
              btnClass,
              "bg-ws-text text-ws-bg hover:bg-ws-text/90 disabled:opacity-40",
            )}
            onClick={onTryInChat}
          >
            Try in Chat
          </Button>
        ) : null}
      </div>

      <ConnectNotionDialog
        open={notionOpen}
        onOpenChange={setNotionOpen}
        onConnect={notion.connect}
        isConnecting={notion.isConnecting}
      />
      <ConnectLinearDialog
        open={linearOpen}
        onOpenChange={setLinearOpen}
        onConnect={linear.connect}
        isConnecting={linear.isConnecting}
      />
      {plugin.id === "netlify" || plugin.id === "vercel" ? (
        <ConnectDeployDialog
          provider={plugin.id}
          open={deployOpen}
          onOpenChange={setDeployOpen}
          onConnect={deploy!.connect}
          isConnecting={deploy!.isConnecting}
        />
      ) : null}
      {plugin.id === "slack" || plugin.id === "discord" ? (
        <ConnectWebhookDialog
          provider={plugin.id}
          open={webhookOpen}
          onOpenChange={setWebhookOpen}
          onConnect={webhook!.connect}
          isConnecting={webhook!.isConnecting}
        />
      ) : null}
    </>
  );
}
