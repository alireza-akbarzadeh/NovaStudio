"use client";

import {
  ActivityIcon,
  BellIcon,
  BugIcon,
  CircleAlertIcon,
  FolderTreeIcon,
  GitBranchIcon,
  BracesIcon,
  ListTreeIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  MoonIcon,
  PackageIcon,
  PuzzleIcon,
  RocketIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  SquareTerminalIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomizeIcon } from "@/features/customize/components/customize-icon";
import { useWorkspaceNotifications } from "@/features/projects/hooks/use-workspace";
import { useProjectDeployments } from "@/features/deploy/hooks/use-deploy-connection";
import { runCommand } from "@/features/workspace/commands/registry";
import { useNotificationKindBadges } from "@/features/workspace/hooks/use-notification-kind-badges";
import { useMonacoProblems } from "@/features/workspace/hooks/use-monaco-problems";
import {
  useWorkspaceStore,
  type LeftPanelView,
} from "@/features/workspace/store/workspace-store";
import { formatModShortcut } from "@/lib/keyboard";
import { useIsApplePlatform } from "@/lib/use-is-apple-platform";
import { cn } from "@/lib/utils";

function formatBadgeCount(count: number) {
  return count > 9 ? "9+" : String(count);
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      aria-hidden
      className="pointer-events-none absolute -top-1 -right-1.5 z-10 animate-ws-badge-pulse"
    >
      <span
        className={cn(
          "flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-ws-accent px-1 text-[8px] leading-none font-semibold text-white shadow-sm",
          "animate-ws-badge-pop",
        )}
      >
        {formatBadgeCount(count)}
      </span>
    </span>
  );
}

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
  /** Overrides the active side indicator color (e.g. emerald when deploy is live). */
  indicatorClassName?: string;
};

const LEFT_ITEMS: ActivityItem[] = [
  {
    view: "explorer",
    label: "Explorer",
    icon: <FolderTreeIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+shift+e",
  },
  {
    view: "search",
    label: "Find in Files",
    icon: <SearchIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+shift+f",
  },
  {
    view: "git",
    label: "Git",
    icon: <GitBranchIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+9",
  },
  {
    view: "env",
    label: "Environment (.env)",
    icon: <BracesIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+alt+e",
  },
  {
    view: "outline",
    label: "Outline",
    icon: <ListTreeIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+shift+o",
  },
  {
    view: "dependencies",
    label: "Dependencies",
    icon: <PackageIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+shift+d",
  },
  {
    view: "extensions",
    label: "Extensions",
    icon: <PuzzleIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+shift+x",
  },
  {
    view: "activity",
    label: "Activity",
    icon: <ActivityIcon className="size-4" strokeWidth={1.75} />,
    shortcut: "mod+shift+a",
  },
];

/** Left-rail items that open editor tabs instead of sidebar panels. */
const LEFT_EDITOR_ACTIONS = [
  {
    id: "customize",
    label: "Customize",
    icon: <CustomizeIcon />,
  },
] as const;

function RailButton({
  label,
  shortcut,
  active,
  onClick,
  children,
  side = "left",
  className,
  indicatorClassName,
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
            "relative flex size-9 items-center justify-center overflow-visible rounded-lg text-ws-text-muted transition-colors",
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
                indicatorClassName,
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
          "flex h-full min-h-0 w-11 shrink-0 flex-col items-center gap-0.5 overflow-y-auto py-1.5",
          side === "left" ? "pr-0.5" : "pl-0.5",
        )}
      >
        {children}
      </nav>
    </TooltipProvider>
  );
}

/** JetBrains-style left activity rail — explorer / search / git / … */
export function WorkspaceLeftActivityBar({ projectId }: { projectId: string }) {
  const isApple = useIsApplePlatform();
  const leftPanelView = useWorkspaceStore((s) => s.leftPanelView);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const setLeftPanelView = useWorkspaceStore((s) => s.setLeftPanelView);
  const editorTabs = useWorkspaceStore((s) => s.editorTabs);
  const activeEditorTabId = useWorkspaceStore((s) => s.activeEditorTabId);
  const editorTabsProjectId = useWorkspaceStore((s) => s.editorTabsProjectId);

  const activeEditorTab = editorTabs.find((tab) => tab.id === activeEditorTabId);
  const customizeActive =
    editorTabsProjectId === projectId && activeEditorTab?.kind === "customize";

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
          shortcut={formatModShortcut(item.shortcut, isApple)}
          active={sidebarOpen && leftPanelView === item.view}
          onClick={() => onSelect(item.view)}
          side="left"
        >
          {item.icon}
        </RailButton>
      ))}
      {LEFT_EDITOR_ACTIONS.map((item) => (
        <RailButton
          key={item.id}
          label={item.label}
          active={customizeActive}
          onClick={() => runCommand("showCustomize")}
          side="left"
        >
          {item.icon}
        </RailButton>
      ))}
    </ActivityRailShell>
  );
}

/** JetBrains-style right activity rail — AI, notifications, terminal, settings. */
export function WorkspaceRightActivityBar({
  projectId,
}: {
  projectId?: string;
}) {
  const isApple = useIsApplePlatform();
  const aiPanelOpen = useWorkspaceStore((s) => s.aiPanelOpen);
  const notificationsPanelOpen = useWorkspaceStore(
    (s) => s.notificationsPanelOpen,
  );
  const chatPanelOpen = useWorkspaceStore((s) => s.chatPanelOpen);
  const commentsPanelOpen = useWorkspaceStore((s) => s.commentsPanelOpen);
  const deployPanelOpen = useWorkspaceStore((s) => s.deployPanelOpen);
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const bottomPanelTab = useWorkspaceStore((s) => s.bottomPanelTab);
  const settingsOpen = useWorkspaceStore((s) => s.settingsOpen);
  const notifications = useWorkspaceNotifications(50);
  const deployments = useProjectDeployments(projectId, 8);
  const badgeCounts = useNotificationKindBadges(projectId);
  const { errorCount, warningCount } = useMonacoProblems();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";
  const problemCount = errorCount + warningCount;
  const unreadCount =
    notifications?.filter((item) => !item.read).length ?? 0;
  const chatUnreadCount = badgeCounts.chat;
  const commentsUnreadCount = badgeCounts.comment;
  // Site is "live" if any recent deploy succeeded — not only the latest attempt.
  const isDeployLive = Boolean(
    projectId &&
      deployments?.some((d) => d.status === "ready" && Boolean(d.url)),
  );

  return (
    <ActivityRailShell label="Tool windows" side="right">
      <div className="flex flex-col items-center gap-0.5">
        <RailButton
          label="AI Assistant"
          shortcut={formatModShortcut("mod+l", isApple)}
          active={aiPanelOpen}
          onClick={() => runCommand("toggleAiPanel")}
          side="right"
        >
          <SparklesIcon className="size-4" strokeWidth={1.75} />
        </RailButton>

        <RailButton
          label={isDeployLive ? "Deploy · Live" : "Deploy"}
          shortcut={formatModShortcut("mod+alt+d", isApple)}
          active={deployPanelOpen}
          onClick={() => runCommand("toggleDeployPanel")}
          side="right"
          indicatorClassName={isDeployLive ? "bg-emerald-400" : undefined}
          className={cn(
            isDeployLive &&
              "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300",
            isDeployLive &&
              deployPanelOpen &&
              "bg-emerald-500/15 shadow-[inset_0_0_0_1px] shadow-emerald-500/40",
          )}
        >
          <span className="relative">
            <RocketIcon
              className={cn(
                "size-4",
                isDeployLive && "animate-ws-deploy-live text-emerald-400",
              )}
              strokeWidth={1.75}
            />
            {isDeployLive ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 animate-ws-deploy-live-dot"
              />
            ) : null}
          </span>
        </RailButton>

        <RailButton
          label={
            chatUnreadCount > 0
              ? `Team Chat · ${chatUnreadCount} new`
              : "Team Chat"
          }
          shortcut={formatModShortcut("mod+shift+c", isApple)}
          active={chatPanelOpen}
          onClick={() => runCommand("toggleChatPanel")}
          side="right"
        >
          <span className="relative">
            <MessageSquareIcon className="size-4" strokeWidth={1.75} />
            <UnreadBadge count={chatUnreadCount} />
          </span>
        </RailButton>

        <RailButton
          label={
            commentsUnreadCount > 0
              ? `Live Comments · ${commentsUnreadCount} new`
              : "Live Comments"
          }
          shortcut={formatModShortcut("mod+shift+u", isApple)}
          active={commentsPanelOpen}
          onClick={() => runCommand("toggleCommentsPanel")}
          side="right"
        >
          <span className="relative">
            <MessageCircleIcon className="size-4" strokeWidth={1.75} />
            <UnreadBadge count={commentsUnreadCount} />
          </span>
        </RailButton>

        <RailButton
          label={
            unreadCount > 0
              ? `Notifications · ${unreadCount} unread`
              : "Notifications"
          }
          shortcut={formatModShortcut("mod+shift+n", isApple)}
          active={notificationsPanelOpen}
          onClick={() => runCommand("toggleNotifications")}
          side="right"
        >
          <span className="relative">
            <BellIcon className="size-4" strokeWidth={1.75} />
            <UnreadBadge count={unreadCount} />
          </span>
        </RailButton>
      </div>

      <div className="mt-auto flex flex-col items-center gap-0.5">
        <RailButton
          label="Problems"
          shortcut={formatModShortcut("mod+shift+m", isApple)}
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
          label="Debug"
          shortcut={formatModShortcut("mod+shift+y", isApple)}
          active={terminalOpen && bottomPanelTab === "debug"}
          onClick={() => runCommand("showDebug")}
          side="right"
        >
          <BugIcon className="size-4" strokeWidth={1.75} />
        </RailButton>

        <RailButton
          label="Terminal"
          shortcut={formatModShortcut("mod+j", isApple)}
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
          shortcut={formatModShortcut("mod+,", isApple)}
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
  return <WorkspaceLeftActivityBar projectId="" />;
}
