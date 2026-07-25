"use client";

import {
  BellIcon,
  BellOffIcon,
  CircleAlertIcon,
  FolderTreeIcon,
  GitBranchIcon,
  ListTreeIcon,
  MoonIcon,
  PackageIcon,
  PuzzleIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  SquareTerminalIcon,
  SunIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePushSubscription } from "@/features/notifications/hooks/use-push-subscription";
import {
  getSoundPrefs,
  playSoundIfEnabled,
  setSoundPrefs,
} from "@/features/notifications/lib/play-sound";
import { runCommand } from "@/features/workspace/commands/registry";
import { useMonacoProblems } from "@/features/workspace/hooks/use-monaco-problems";
import {
  useWorkspaceStore,
  type LeftPanelView,
} from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type ActivityItem = {
  view: LeftPanelView;
  label: string;
  icon: React.ReactNode;
  shortcut: string;
};

type RailButtonProps = {
  label: string;
  shortcut?: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  side?: "left" | "right";
  className?: string;
};

const LEFT_ITEMS: ActivityItem[] = [
  {
    view: "explorer",
    label: "Explorer",
    icon: <FolderTreeIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "⌘⇧E",
  },
  {
    view: "search",
    label: "Find in Files",
    icon: <SearchIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "⌘⇧F",
  },
  {
    view: "git",
    label: "Git",
    icon: <GitBranchIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "⌘9",
  },
  {
    view: "outline",
    label: "Outline",
    icon: <ListTreeIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "⌘⇧O",
  },
  {
    view: "dependencies",
    label: "Dependencies",
    icon: <PackageIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "⌘⇧D",
  },
  {
    view: "extensions",
    label: "Extensions",
    icon: <PuzzleIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "⌘⇧X",
  },
];

function RailButton({
  label,
  shortcut,
  active,
  onClick,
  children,
  side = "left",
  className,
}: RailButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          className={cn(
            "relative flex size-9 items-center justify-center rounded-lg text-ws-text-muted transition-colors",
            "hover:bg-ws-hover hover:text-ws-text",
            active &&
              "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35",
            className,
          )}
        >
          {active ? (
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-ws-accent",
                side === "left" ? "left-0" : "right-0",
              )}
            />
          ) : null}
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side === "left" ? "right" : "left"}
        sideOffset={8}
        className="flex items-center gap-2 border border-ws-border-strong bg-ws-hover px-2 py-1 text-ws-text [&_svg]:hidden"
      >
        <span className="text-xs">{label}</span>
        {shortcut ? (
          <span className="text-[10px] text-ws-text-muted">{shortcut}</span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

function ActivityRailShell({
  label,
  side,
  children,
}: {
  label: string;
  side: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <nav
        aria-label={label}
        className={cn(
          "flex w-11 shrink-0 flex-col items-center gap-0.5 py-1.5",
          side === "left" ? "pr-0.5" : "pl-0.5",
        )}
      >
        {children}
      </nav>
    </TooltipProvider>
  );
}

/** JetBrains-style left activity rail — explorer / search / git / … */
export function WorkspaceLeftActivityBar() {
  const leftPanelView = useWorkspaceStore((s) => s.leftPanelView);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const setLeftPanelView = useWorkspaceStore((s) => s.setLeftPanelView);

  const onSelect = (view: LeftPanelView) => {
    if (leftPanelView === view && sidebarOpen) {
      runCommand("toggleSidebar");
    } else {
      setLeftPanelView(view);
    }
  };

  return (
    <ActivityRailShell label="Sidebar views" side="left">
      {LEFT_ITEMS.map((item) => (
        <RailButton
          key={item.view}
          label={item.label}
          shortcut={item.shortcut}
          active={sidebarOpen && leftPanelView === item.view}
          onClick={() => onSelect(item.view)}
          side="left"
        >
          {item.icon}
        </RailButton>
      ))}
    </ActivityRailShell>
  );
}

function WorkspaceNotificationRailButton() {
  const push = usePushSubscription();
  const [soundsOn, setSoundsOn] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setSoundsOn(getSoundPrefs().enabled);
  }, []);

  const toggleSounds = () => {
    const next = setSoundPrefs({ enabled: !soundsOn });
    setSoundsOn(next.enabled);
    if (next.enabled) void playSoundIfEnabled("aiDone");
  };

  const togglePush = async () => {
    try {
      if (push.subscribed) {
        await push.disablePush();
        toast.success("Push notifications disabled");
      } else {
        await push.enablePush();
        toast.success("Push notifications enabled");
        void playSoundIfEnabled("success");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update push",
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Notifications"
              aria-pressed={open}
              className={cn(
                "relative flex size-9 items-center justify-center rounded-lg text-ws-text-muted transition-colors",
                "hover:bg-ws-hover hover:text-ws-text",
                open &&
                  "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35",
              )}
            >
              {push.subscribed ? (
                <BellIcon className="size-4" strokeWidth={1.75} />
              ) : (
                <BellOffIcon className="size-4" strokeWidth={1.75} />
              )}
              {push.subscribed ? (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-ws-accent" />
              ) : null}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          sideOffset={8}
          className="border border-ws-border-strong bg-ws-hover px-2 py-1 text-ws-text [&_svg]:hidden"
        >
          <span className="text-xs">Notifications</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        side="left"
        sideOffset={10}
        className="w-56 border-ws-border bg-ws-panel p-2 text-ws-text shadow-lg"
      >
        <p className="mb-2 px-1 text-[11px] font-medium text-ws-text">
          Notifications
        </p>
        <p className="mb-2 px-1 text-[11px] leading-relaxed text-ws-text-muted">
          Alerts for AI runs and project updates. Inbox coming soon.
        </p>
        <div className="flex flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 justify-start gap-2 rounded-lg px-2 text-[12px] text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text"
            onClick={toggleSounds}
          >
            {soundsOn ? (
              <Volume2Icon className="size-3.5" strokeWidth={1.75} />
            ) : (
              <VolumeXIcon className="size-3.5" strokeWidth={1.75} />
            )}
            {soundsOn ? "Sounds on" : "Sounds muted"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={push.busy || !push.configured}
            className="h-8 justify-start gap-2 rounded-lg px-2 text-[12px] text-ws-text-secondary hover:bg-ws-hover hover:text-ws-text"
            onClick={() => void togglePush()}
          >
            {push.subscribed ? (
              <BellIcon className="size-3.5 text-ws-accent" strokeWidth={1.75} />
            ) : (
              <BellOffIcon className="size-3.5" strokeWidth={1.75} />
            )}
            {push.subscribed ? "Push enabled" : "Enable push"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** JetBrains-style right activity rail — AI, notifications, terminal, settings. */
export function WorkspaceRightActivityBar() {
  const aiPanelOpen = useWorkspaceStore((s) => s.aiPanelOpen);
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const bottomPanelTab = useWorkspaceStore((s) => s.bottomPanelTab);
  const settingsOpen = useWorkspaceStore((s) => s.settingsOpen);
  const { errorCount, warningCount } = useMonacoProblems();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";
  const problemCount = errorCount + warningCount;

  return (
    <ActivityRailShell label="Tool windows" side="right">
      <div className="flex flex-col items-center gap-0.5">
        <RailButton
          label="AI Assistant"
          shortcut="⌘L"
          active={aiPanelOpen}
          onClick={() => runCommand("toggleAiPanel")}
          side="right"
        >
          <SparklesIcon className="size-4" strokeWidth={1.75} />
        </RailButton>

        <WorkspaceNotificationRailButton />
      </div>

      <div className="mt-auto flex flex-col items-center gap-0.5">
        <RailButton
          label="Problems"
          shortcut="⌘⇧M"
          active={terminalOpen && bottomPanelTab === "problems"}
          onClick={() => runCommand("showProblems")}
          side="right"
        >
          <span className="relative">
            <CircleAlertIcon className="size-4" strokeWidth={1.75} />
            {problemCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-ws-danger-bg" />
            ) : null}
          </span>
        </RailButton>

        <RailButton
          label="Terminal"
          shortcut="⌘J"
          active={terminalOpen && bottomPanelTab === "terminal"}
          onClick={() => runCommand("toggleTerminal")}
          side="right"
        >
          <SquareTerminalIcon className="size-4" strokeWidth={1.75} />
        </RailButton>

        <RailButton
          label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          side="right"
        >
          {isDark ? (
            <SunIcon className="size-4" strokeWidth={1.75} />
          ) : (
            <MoonIcon className="size-4" strokeWidth={1.75} />
          )}
        </RailButton>

        <RailButton
          label="Settings"
          shortcut="⌘,"
          active={settingsOpen}
          onClick={() => runCommand("openSettings")}
          side="right"
        >
          <SettingsIcon className="size-4" strokeWidth={1.75} />
        </RailButton>
      </div>
    </ActivityRailShell>
  );
}

/** @deprecated Prefer WorkspaceLeftActivityBar. */
export function WorkspaceViewSwitcher() {
  return null;
}

/** @deprecated Utilities moved to WorkspaceRightActivityBar. */
export function WorkspaceSidebarUtilities() {
  return null;
}

/** @deprecated Prefer WorkspaceLeftActivityBar. */
export function WorkspaceActivityBar() {
  return <WorkspaceLeftActivityBar />;
}
