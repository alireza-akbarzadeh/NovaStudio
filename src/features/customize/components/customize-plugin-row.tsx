"use client";

import { ChevronRightIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";

import { CustomizePluginActions } from "@/features/customize/components/customize-plugin-actions";
import type { CustomizePlugin } from "@/features/customize/lib/customize-catalog";
import { pluginNeedsConnect } from "@/features/customize/lib/customize-catalog";
import { CustomizePluginIcon } from "@/features/customize/components/customize-plugin-icon";
import { usePluginConnectionFromContext } from "@/features/customize/components/customize-connections-provider";
import { useUserPlugins } from "@/features/customize/hooks/use-user-plugins";
import { cn } from "@/lib/utils";

type CustomizePluginRowProps = {
  plugin: CustomizePlugin;
  expanded: boolean;
  isActiveTab?: boolean;
  onToggle: () => void;
  onOpenDetails: () => void;
  onTryInChat?: () => void;
  showInstallAction?: boolean;
};

export function CustomizePluginRow({
  plugin,
  expanded,
  isActiveTab = false,
  onToggle,
  onOpenDetails,
  onTryInChat,
  showInstallAction = false,
}: CustomizePluginRowProps) {
  const { installedIds, ready, install } = useUserPlugins();
  const { isConnected, isLoading } = usePluginConnectionFromContext(plugin.id);
  const isInstalled = installedIds.has(plugin.id);
  const needsConnect = pluginNeedsConnect(plugin);

  const highlighted = expanded || isActiveTab;

  return (
    <div
      className={cn(
        "group transition-colors",
        highlighted && "bg-ws-hover/40",
        isActiveTab && "shadow-[inset_2px_0_0_0] shadow-ws-accent",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 text-ws-text-muted transition-transform duration-200",
              expanded && "rotate-90",
            )}
            strokeWidth={2}
          />
          <CustomizePluginIcon pluginId={plugin.id} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-[13px] font-medium text-ws-text">
                {plugin.name}
              </p>
              {!ready ? (
                <Loader2Icon className="size-3 animate-spin text-ws-text-muted" />
              ) : isInstalled ? (
                needsConnect ? (
                  isLoading ? null : isConnected ? (
                    <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                      Connected
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                      Not connected
                    </span>
                  )
                ) : (
                  <span className="rounded-full bg-ws-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-ws-accent">
                    Installed
                  </span>
                )
              ) : null}
            </div>
            <p className="truncate text-[11px] text-ws-text-muted">
              {plugin.publisher}
            </p>
          </div>
        </button>

        {showInstallAction && !isInstalled ? (
          <button
            type="button"
            className={cn(
              "shrink-0 rounded-full border border-ws-border-subtle px-2.5 py-1 text-[10px] font-medium text-ws-text-muted",
              "hover:border-ws-border-strong hover:bg-ws-hover hover:text-ws-text",
            )}
            onClick={(event) => {
              event.stopPropagation();
              void install(plugin.id);
            }}
          >
            Install
          </button>
        ) : (
          <button
            type="button"
            title="Open in editor tab"
            aria-label={`Open ${plugin.name} in editor tab`}
            className={cn(
              "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-ws-text-muted",
              "transition-opacity hover:bg-ws-hover hover:text-ws-text",
              highlighted ? "opacity-100" : "opacity-0 group-hover:opacity-70",
            )}
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails();
            }}
          >
            <ExternalLinkIcon className="size-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 border-t border-ws-border-subtle/60 px-4 pt-2 pb-4 pl-14">
            <p className="text-[11px] leading-relaxed text-ws-text-muted">
              {plugin.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-ws-text-muted">
              <span>{plugin.skills.length} skills</span>
              <span>·</span>
              <span>{plugin.rules.length} rules</span>
            </div>
            <CustomizePluginActions
              plugin={plugin}
              compact
              onTryInChat={onTryInChat}
            />
            <button
              type="button"
              className="text-[11px] text-ws-accent hover:underline"
              onClick={onOpenDetails}
            >
              Open full page →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
