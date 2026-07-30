"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CustomizePluginIcon } from "@/features/customize/components/customize-plugin-icon";
import { useUserPlugins } from "@/features/customize/hooks/use-user-plugins";
import type { CustomizePluginId } from "@/features/customize/lib/customize-catalog";
import { cn } from "@/lib/utils";

type PluginNotInstalledPromptProps = {
  projectId: string;
  pluginId: CustomizePluginId;
  pluginName: string;
  description?: string;
  className?: string;
};

export function PluginNotInstalledPrompt({
  projectId,
  pluginId,
  pluginName,
  description,
  className,
}: PluginNotInstalledPromptProps) {
  const { ready, install, installedIds } = useUserPlugins();
  const isInstalled = installedIds.has(pluginId);

  if (isInstalled) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-ws-border-subtle bg-ws-stage/20 px-4 py-8 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-ws-hover/60">
        <CustomizePluginIcon pluginId={pluginId} size="sm" />
      </div>
      <p className="text-[12px] font-medium text-ws-text">{pluginName}</p>
      <p className="mx-auto mt-1 max-w-xs text-[11px] leading-relaxed text-ws-text-muted">
        {description ??
          "No plugin installed yet. Browse the marketplace to add one."}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!ready}
          onClick={() => void install(pluginId)}
          className="h-7 bg-ws-accent px-3 text-[11px] text-white hover:bg-ws-accent-hover"
        >
          {!ready ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <PlusIcon className="size-3.5" />
          )}
          Install
        </Button>
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="h-7 border-ws-border bg-ws-bg px-3 text-[11px] text-ws-text hover:bg-ws-hover"
        >
          <Link href={`/projects/${projectId}/customize?view=marketplace`}>
            Browse marketplace
          </Link>
        </Button>
      </div>
    </div>
  );
}
