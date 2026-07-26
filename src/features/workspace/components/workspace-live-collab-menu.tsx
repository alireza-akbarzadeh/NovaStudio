"use client";

import {
  CheckIcon,
  RadioIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { runCommand } from "@/features/workspace/commands/registry";
import {
  isLiveblocksConfigured,
  shouldUseLiveblocksCollaboration,
} from "@/features/workspace/lib/liveblocks-configured";
import { cn } from "@/lib/utils";

export function WorkspaceLiveCollabMenu() {
  const liveCollaboration = useEditorSettingsStore((s) => s.liveCollaboration);
  const setSettings = useEditorSettingsStore((s) => s.setSettings);
  const [menuOpen, setMenuOpen] = useState(false);

  const configured = isLiveblocksConfigured();
  const liveOn = shouldUseLiveblocksCollaboration(liveCollaboration);

  const setLiveCollaboration = (enabled: boolean) => {
    if (!configured && enabled) {
      toast.message("Liveblocks is not configured", {
        description:
          "Add LIVEBLOCKS_SECRET_KEY and NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY.",
      });
      return;
    }
    setSettings({ liveCollaboration: enabled });
    toast.message(
      enabled ? "Live editing on" : "Live editing off",
      {
        description: enabled
          ? "Shared editing and named cursors are active for this account."
          : "Files save locally with Auto Save / ⌘S — no Liveblocks room.",
      },
    );
  };

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Live editing"
              aria-pressed={liveOn}
              className={cn(
                "relative size-7 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                liveOn &&
                  "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/30",
              )}
            >
              <UsersIcon className="size-3.5" strokeWidth={1.75} />
              {liveOn ? (
                <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-emerald-400" />
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          sideOffset={6}
          className="border border-ws-border-strong bg-ws-hover px-2.5 py-1.5 text-ws-text [&_svg]:hidden"
        >
          <span className="text-xs">
            Live editing · {liveOn ? "On" : configured ? "Off" : "Unavailable"}
          </span>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent
        align="end"
        className="w-72 border-ws-border bg-ws-panel text-ws-text"
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-2 text-[11px] text-ws-text-muted">
          <span className="flex items-center gap-1.5">
            <RadioIcon className="size-3" />
            Live editing
          </span>
          <span
            className={cn(
              "font-medium",
              liveOn ? "text-emerald-400" : "text-ws-text-muted",
            )}
          >
            {liveOn ? "On" : configured ? "Off" : "Unavailable"}
          </span>
        </DropdownMenuLabel>

        <p className="px-2 pb-2 text-[11px] leading-relaxed text-ws-text-muted">
          {configured
            ? "Share a file with teammates to see named cursors and edit together in real time."
            : "Add Liveblocks keys to your environment to enable realtime collaboration."}
        </p>

        <DropdownMenuSeparator className="bg-ws-border" />

        <DropdownMenuCheckboxItem
          checked={liveOn}
          disabled={!configured}
          onCheckedChange={(checked) => setLiveCollaboration(Boolean(checked))}
          className="text-[12px] focus:bg-ws-menu-focus focus:text-white"
        >
          Enable Liveblocks live editing
        </DropdownMenuCheckboxItem>

        {liveOn ? (
          <div className="flex items-start gap-2 px-2 py-2 text-[11px] text-ws-text-secondary">
            <CheckIcon className="mt-0.5 size-3 shrink-0 text-emerald-400" />
            <span>
              Connected when you open a file. Teammates see your caret and name
              pill.
            </span>
          </div>
        ) : null}

        <DropdownMenuSeparator className="bg-ws-border" />

        <DropdownMenuItem
          className="gap-2 text-[12px] focus:bg-ws-menu-focus focus:text-white"
          onClick={() => runCommand("openSettings")}
        >
          <SettingsIcon className="size-3.5 opacity-70" />
          Editor settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
