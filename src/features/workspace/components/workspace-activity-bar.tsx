"use client";

import {
  CircleAlertIcon,
  FolderTreeIcon,
  GitBranchIcon,
  ListTreeIcon,
  MoonIcon,
  PackageIcon,
  PuzzleIcon,
  SearchIcon,
  SettingsIcon,
  SquareTerminalIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  shortLabel: string;
  icon: React.ReactNode;
  shortcut: string;
};

type UtilityItem = {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
};

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    view: "explorer",
    label: "Explorer",
    shortLabel: "Files",
    icon: <FolderTreeIcon className="size-3.5" strokeWidth={1.75} />,
    shortcut: "⌘⇧E",
  },
  {
    view: "search",
    label: "Find in Files",
    shortLabel: "Search",
    icon: <SearchIcon className="size-3.5" strokeWidth={1.75} />,
    shortcut: "⌘⇧F",
  },
  {
    view: "git",
    label: "Git",
    shortLabel: "Git",
    icon: <GitBranchIcon className="size-3.5" strokeWidth={1.75} />,
    shortcut: "⌘9",
  },
  {
    view: "outline",
    label: "Outline",
    shortLabel: "Outline",
    icon: <ListTreeIcon className="size-3.5" strokeWidth={1.75} />,
    shortcut: "⌘⇧O",
  },
  {
    view: "dependencies",
    label: "Dependencies",
    shortLabel: "Deps",
    icon: <PackageIcon className="size-3.5" strokeWidth={1.75} />,
    shortcut: "⌘⇧D",
  },
  {
    view: "extensions",
    label: "Extensions",
    shortLabel: "Ext",
    icon: <PuzzleIcon className="size-3.5" strokeWidth={1.75} />,
    shortcut: "⌘⇧X",
  },
];

/** Horizontal view switcher — replaces the VS Code-style activity rail. */
export function WorkspaceViewSwitcher() {
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
    <TooltipProvider delayDuration={300}>
      <nav
        aria-label="Sidebar views"
        className="flex items-center gap-0.5 overflow-x-auto px-1.5 py-1"
      >
        {ACTIVITY_ITEMS.map((item) => {
          const active = sidebarOpen && leftPanelView === item.view;
          return (
            <Tooltip key={item.view}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={item.label}
                  aria-pressed={active}
                  onClick={() => onSelect(item.view)}
                  className={cn(
                    "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/35"
                      : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                  )}
                >
                  {item.icon}
                  <span className="hidden min-[220px]:inline">{item.shortLabel}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={6}
                className="flex items-center gap-2 border border-ws-border-strong bg-ws-hover px-2 py-1 text-ws-text [&_svg]:hidden"
              >
                <span className="text-xs">{item.label}</span>
                <span className="text-[10px] text-ws-text-muted">
                  {item.shortcut}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}

/** Compact utility chips for sidebar footer (Problems, Terminal, theme, settings). */
export function WorkspaceSidebarUtilities() {
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

  const utilityItems: UtilityItem[] = [
    {
      id: "problems",
      label: "Problems",
      shortcut: "⌘⇧M",
      icon: (
        <span className="relative">
          <CircleAlertIcon className="size-3.5" strokeWidth={1.75} />
          {problemCount > 0 ? (
            <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-ws-danger-bg" />
          ) : null}
        </span>
      ),
      active: terminalOpen && bottomPanelTab === "problems",
      onClick: () => runCommand("showProblems"),
    },
    {
      id: "terminal",
      label: "Terminal",
      shortcut: "⌘J",
      icon: <SquareTerminalIcon className="size-3.5" strokeWidth={1.75} />,
      active: terminalOpen && bottomPanelTab === "terminal",
      onClick: () => runCommand("toggleTerminal"),
    },
    {
      id: "theme",
      label: isDark ? "Switch to Light Theme" : "Switch to Dark Theme",
      icon: isDark ? (
        <SunIcon className="size-3.5" strokeWidth={1.75} />
      ) : (
        <MoonIcon className="size-3.5" strokeWidth={1.75} />
      ),
      onClick: () => setTheme(isDark ? "light" : "dark"),
    },
    {
      id: "settings",
      label: "Settings",
      shortcut: "⌘,",
      icon: <SettingsIcon className="size-3.5" strokeWidth={1.75} />,
      active: settingsOpen,
      onClick: () => runCommand("openSettings"),
    },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-between gap-1 border-t border-ws-border-subtle px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {utilityItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={item.label}
                  aria-pressed={item.active}
                  onClick={item.onClick}
                  className={cn(
                    "size-7 rounded-lg text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                    item.active &&
                      "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/30",
                  )}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={6}
                className="flex items-center gap-2 border border-ws-border-strong bg-ws-hover px-2 py-1 text-ws-text [&_svg]:hidden"
              >
                <span className="text-xs">{item.label}</span>
                {item.shortcut ? (
                  <span className="text-[10px] text-ws-text-muted">
                    {item.shortcut}
                  </span>
                ) : null}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

/** @deprecated Prefer WorkspaceViewSwitcher — kept for any stray imports. */
export function WorkspaceActivityBar() {
  return <WorkspaceViewSwitcher />;
}
