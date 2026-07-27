"use client";

import {
  Columns2Icon,
  FileDiffIcon,
  FileIcon,
  FileJsonIcon,
  FolderPlusIcon,
  KeyboardIcon,
  MoreVerticalIcon,
  PinIcon,
  PinOffIcon,
  Settings2Icon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import {
  type DragEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { NewProjectForm } from "@/features/projects/components/new-project-form";
import { ShortcutsPanel } from "@/features/settings/components/shortcuts-panel";
import { runCommand } from "@/features/workspace/commands/registry";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useFileDirtyStore } from "@/features/workspace/lib/file-save-controller";
import {
  type EditorTab,
  useWorkspaceStore,
} from "@/features/workspace/store/workspace-store";
import { FileDiffView } from "@/features/workspace/views/file-diff-view";
import { ActivityDiffView } from "@/features/workspace/views/activity-diff-view";
import { FileEditorView } from "@/features/workspace/views/file-editor-view";
import { ProjectWorkspaceHome } from "@/features/workspace/views/project-workspace-home";
import { WorkspaceSettingsView } from "@/features/workspace/views/workspace-settings-view";
import { WorkspaceUserJsonView } from "@/features/workspace/views/workspace-user-json-view";
import { cn } from "@/lib/utils";

type WorkspaceEditorTabsProps = {
  projectId: string;
};

function TabIcon({ tab }: { tab: EditorTab }) {
  switch (tab.kind) {
    case "settings":
      return <Settings2Icon className="size-3 shrink-0 opacity-70" />;
    case "shortcuts":
      return <KeyboardIcon className="size-3 shrink-0 opacity-70" />;
    case "user-json":
      return <FileJsonIcon className="size-3 shrink-0 opacity-70" />;
    case "new-project":
      return <FolderPlusIcon className="size-3 shrink-0 opacity-70" />;
    case "diff":
      return <FileDiffIcon className="size-3 shrink-0 opacity-70" />;
    case "activity-diff":
      return <FileDiffIcon className="size-3 shrink-0 opacity-70" />;
    case "file":
      return <FileIcon className="size-3 shrink-0 opacity-70" />;
    default:
      return null;
  }
}

const TAB_MENU_ITEM =
  "cursor-default gap-0 py-1 text-[12px] text-ws-text focus:bg-ws-menu-focus focus:text-white";
const TAB_MENU_SEPARATOR = "mx-0 my-1 bg-ws-border";

const OVERFLOW_ITEM =
  "cursor-default text-[12px] text-ws-text focus:bg-ws-menu-focus focus:text-white";

function EditorTabsOverflowMenu({
  hasTabs,
  closeAllTabs,
  closeUnmodifiedTabs,
  bookmarkOpenTabs,
}: {
  hasTabs: boolean;
  closeAllTabs: () => void;
  closeUnmodifiedTabs: () => void;
  bookmarkOpenTabs: () => void;
}) {
  const openSettings = useWorkspaceStore((s) => s.openSettings);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Editor tab options"
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <MoreVerticalIcon className="size-3.5" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={4}
        className="min-w-56 rounded-lg border-ws-border bg-ws-panel p-1 text-ws-text shadow-lg"
      >
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          onClick={() => runCommand("saveFile")}
        >
          Save
          <DropdownMenuShortcut className="text-ws-text-muted">
            ⌘S
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          onClick={() => runCommand("saveAllFiles")}
        >
          Save All
          <DropdownMenuShortcut className="text-ws-text-muted">
            ⌘⇧S
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="mx-0 my-1 bg-ws-border" />
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          onClick={() => runCommand("openCommandPalette")}
        >
          Recent Files
          <DropdownMenuShortcut className="text-ws-text-muted">
            Ctrl+E
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          onClick={() => runCommand("openCommandPalette")}
        >
          Recent Locations
          <DropdownMenuShortcut className="text-ws-text-muted">
            Ctrl+Shift+E
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          onClick={() => runCommand("openGoToFile")}
        >
          Go to File...
          <DropdownMenuShortcut className="text-ws-text-muted">
            Ctrl+Shift+N
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-ws-border" />
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          disabled={!hasTabs}
          onClick={closeAllTabs}
        >
          Close All Tabs
        </DropdownMenuItem>
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          disabled={!hasTabs}
          onClick={closeUnmodifiedTabs}
        >
          Close Unmodified Tabs
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-ws-border" />
        <DropdownMenuItem
          className={OVERFLOW_ITEM}
          disabled={!hasTabs}
          onClick={bookmarkOpenTabs}
        >
          Bookmark Open Tabs...
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-ws-border" />
        <DropdownMenuItem className={OVERFLOW_ITEM} onClick={openSettings}>
          Configure Editor Tabs...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WorkspaceEditorTabs({ projectId }: WorkspaceEditorTabsProps) {
  const {
    tabs,
    activeTabId,
    selectTab,
    closeTab,
    closeAllTabs,
    closeUnmodifiedTabs,
    bookmarkOpenTabs,
    reorderTab,
    splitTab,
    pinTab,
    unpinTab,
    keepOpen,
  } = useEditorTabs(projectId);
  const dirtyMap = useFileDirtyStore((s) => s.dirty);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const onDragStart = (event: DragEvent<HTMLDivElement>, tabId: string) => {
    dragIdRef.current = tabId;
    setDraggingId(tabId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", tabId);
  };

  const onDragEnd = () => {
    dragIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>, tabId: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragIdRef.current && dragIdRef.current !== tabId) {
      setDropTargetId(tabId);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>, toId: string) => {
    event.preventDefault();
    const fromId = dragIdRef.current ?? event.dataTransfer.getData("text/plain");
    if (fromId && fromId !== toId) {
      reorderTab(fromId, toId);
    }
    onDragEnd();
  };

  return (
    <div
      role="tablist"
      aria-label="Editor tabs"
      className="flex h-9 shrink-0 items-center gap-0.5 overflow-x-auto px-1.5"
    >
      <EditorTabsOverflowMenu
        hasTabs={tabs.length > 0}
        closeAllTabs={closeAllTabs}
        closeUnmodifiedTabs={closeUnmodifiedTabs}
        bookmarkOpenTabs={bookmarkOpenTabs}
      />

      {tabs.length === 0 ? (
        <p className="truncate px-2 text-[11px] font-medium text-ws-text-muted">
          Editor
        </p>
      ) : (
        tabs.map((tab, index) => {
          const active = tab.id === activeTabId;
          const isDragging = draggingId === tab.id;
          const isDropTarget = dropTargetId === tab.id && draggingId !== tab.id;
          const isDirty =
            tab.kind === "file" &&
            Boolean(tab.path) &&
            Boolean(dirtyMap[`${projectId}:${tab.path}`]);
          const showPinnedDivider =
            Boolean(tab.pinned) &&
            !tabs[index + 1]?.pinned &&
            tabs.some((t) => !t.pinned);

          return (
            <ContextMenu key={tab.id}>
              <ContextMenuTrigger asChild>
                <div
                  role="tab"
                  aria-selected={active}
                  draggable
                  onDragStart={(event) => onDragStart(event, tab.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={(event) => onDragOver(event, tab.id)}
                  onDrop={(event) => onDrop(event, tab.id)}
                  onDragLeave={() => {
                    if (dropTargetId === tab.id) setDropTargetId(null);
                  }}
                  className={cn(
                    "group relative flex max-w-45 min-w-0 cursor-grab items-center gap-0.5 px-2 py-1 text-[12px] active:cursor-grabbing",
                    active
                      ? "rounded-md bg-ws-hover text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-border-strong"
                      : "rounded-md text-ws-text-muted hover:text-ws-text-secondary",
                    isDragging && "opacity-50",
                    isDropTarget &&
                      "before:absolute before:inset-y-1 before:left-0 before:z-10 before:w-0.5 before:rounded-full before:bg-ws-accent",
                    showPinnedDivider &&
                      "mr-1 after:ml-1 after:h-3.5 after:w-px after:bg-ws-border-strong after:content-['']",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    onDoubleClick={() => {
                      if (tab.preview) keepOpen(tab.id);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                    title={
                      isDirty
                        ? `${tab.path ?? tab.title} (unsaved)`
                        : (tab.path ?? tab.title)
                    }
                  >
                    {tab.pinned ? (
                      <PinIcon className="size-3 shrink-0 text-ws-accent opacity-80" />
                    ) : (
                      <TabIcon tab={tab} />
                    )}
                    <span
                      className={cn(
                        "truncate font-normal",
                        tab.preview && "italic",
                        isDirty && "text-ws-text",
                      )}
                    >
                      {tab.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={
                      isDirty ? `Unsaved — close ${tab.title}` : `Close ${tab.title}`
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={cn(
                      "relative inline-flex size-4 shrink-0 items-center justify-center rounded-sm text-ws-text-muted transition-opacity hover:bg-ws-hover-deep hover:text-ws-text",
                      active || isDirty
                        ? "opacity-70"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {isDirty ? (
                      <>
                        <span
                          aria-hidden
                          className="size-1.5 rounded-full bg-ws-accent group-hover:hidden"
                        />
                        <XIcon className="hidden size-3 group-hover:block" />
                      </>
                    ) : (
                      <XIcon className="size-3" />
                    )}
                  </button>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="min-w-48 rounded-lg border-ws-border bg-ws-hover p-1 text-ws-text shadow-lg">
                {tab.preview ? (
                  <ContextMenuItem
                    className={TAB_MENU_ITEM}
                    onClick={() => keepOpen(tab.id)}
                  >
                    Keep Open
                  </ContextMenuItem>
                ) : null}
                {tab.pinned ? (
                  <ContextMenuItem
                    className={TAB_MENU_ITEM}
                    onClick={() => unpinTab(tab.id)}
                  >
                    <PinOffIcon className="mr-2 size-3.5 opacity-70" />
                    Unpin
                  </ContextMenuItem>
                ) : (
                  <ContextMenuItem
                    className={TAB_MENU_ITEM}
                    onClick={() => pinTab(tab.id)}
                  >
                    <PinIcon className="mr-2 size-3.5 opacity-70" />
                    Pin
                  </ContextMenuItem>
                )}
                <ContextMenuItem
                  className={TAB_MENU_ITEM}
                  onClick={() => splitTab(tab.id)}
                >
                  <Columns2Icon className="mr-2 size-3.5 opacity-70" />
                  Split Window
                </ContextMenuItem>
                <ContextMenuSeparator className={TAB_MENU_SEPARATOR} />
                <ContextMenuItem
                  className={TAB_MENU_ITEM}
                  onClick={() => closeTab(tab.id)}
                >
                  Close
                </ContextMenuItem>
                <ContextMenuItem
                  className={TAB_MENU_ITEM}
                  onClick={closeUnmodifiedTabs}
                >
                  Close Unmodified Tabs
                </ContextMenuItem>
                <ContextMenuItem
                  className={TAB_MENU_ITEM}
                  onClick={closeAllTabs}
                >
                  Close All Tabs
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        })
      )}
    </div>
  );
}

function SplitPaneContent({
  projectId,
  tab,
}: {
  projectId: string;
  tab: EditorTab;
}) {
  switch (tab.kind) {
    case "file":
      return (
        <FileEditorView
          projectId={projectId}
          filePath={tab.path ?? ""}
          syncWorkspaceChrome={false}
        />
      );
    case "diff":
      return (
        <FileDiffView
          projectId={projectId}
          filePath={tab.path ?? ""}
          syncWorkspaceChrome={false}
        />
      );
    case "activity-diff":
      return tab.activityId ? (
        <ActivityDiffView
          projectId={projectId}
          activityId={tab.activityId}
          syncWorkspaceChrome={false}
        />
      ) : null;
    case "settings":
      return <WorkspaceSettingsView projectId={projectId} />;
    case "user-json":
      return <WorkspaceUserJsonView />;
    case "shortcuts":
      return (
        <div className="h-full overflow-auto px-6 py-8">
          <ShortcutsPanel />
        </div>
      );
    case "new-project":
      return (
        <div className="h-full overflow-auto px-6 py-8">
          <NewProjectForm />
        </div>
      );
    case "welcome":
    default:
      return <ProjectWorkspaceHome projectId={projectId} />;
  }
}

function EditorSplitPane({
  projectId,
  tab,
  onClose,
}: {
  projectId: string;
  tab: EditorTab;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-stage">
      <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-ws-border-subtle px-2.5">
        <TabIcon tab={tab} />
        <span
          className="min-w-0 flex-1 truncate text-[11px] font-medium text-ws-text"
          title={tab.path ?? tab.title}
        >
          {tab.title}
        </span>
        <button
          type="button"
          aria-label="Close split window"
          onClick={onClose}
          className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <XIcon className="size-3" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <SplitPaneContent projectId={projectId} tab={tab} />
      </div>
    </div>
  );
}

const stagePaneClass =
  "h-full min-h-0 overflow-hidden rounded-[10px] border border-ws-border-subtle bg-ws-stage shadow-[0_1px_0_color-mix(in_oklab,var(--ws-text)_4%,transparent)]";

const MAX_MOUNTED_FILE_TABS = 3;

function EditorPrimarySurface({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const { tabs, activeTabId } = useEditorTabs(projectId);
  const [mountedTabIds, setMountedTabIds] = useState<string[]>([]);
  const fileTabs = tabs.filter(
    (tab): tab is EditorTab & { kind: "file"; path: string } =>
      tab.kind === "file" && Boolean(tab.path),
  );
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activeFileKeptAlive =
    activeTab?.kind === "file" &&
    fileTabs.some((tab) => tab.id === activeTab.id);

  useEffect(() => {
    if (!activeTabId) return;
    setMountedTabIds((prev) =>
      [activeTabId, ...prev.filter((id) => id !== activeTabId)].slice(
        0,
        MAX_MOUNTED_FILE_TABS,
      ),
    );
  }, [activeTabId]);

  const mountedTabIdSet = useMemo(
    () => new Set(mountedTabIds),
    [mountedTabIds],
  );

  if (tabs.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 bg-ws-stage px-6 text-center">
        <Image
          src="/logo.svg"
          alt=""
          width={28}
          height={28}
          className="size-7 opacity-80"
        />
        <div className="space-y-1">
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-ws-text">
            Start writing
          </p>
          <p className="text-[12px] text-ws-text-muted">
            Open a file from the sidebar, or press ⌘P to jump
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0">
      {/* Keep recently used file editors mounted so tab switches preserve
          unsaved buffers without holding Monaco for every open tab. */}
      {fileTabs.map((tab) => {
        const active = tab.id === activeTabId;
        if (!mountedTabIdSet.has(tab.id)) {
          return null;
        }
        return (
          <div
            key={tab.id}
            className={cn(
              "absolute inset-0",
              !active && "pointer-events-none invisible",
            )}
            aria-hidden={!active}
          >
            <FileEditorView
              projectId={projectId}
              filePath={tab.path}
              syncWorkspaceChrome={active}
            />
          </div>
        );
      })}

      {!activeFileKeptAlive ? (
        <div className="absolute inset-0">{children}</div>
      ) : null}
    </div>
  );
}

type WorkspaceEditorPanelProps = {
  projectId: string;
  children: ReactNode;
};

export function WorkspaceEditorPanel({
  projectId,
  children,
}: WorkspaceEditorPanelProps) {
  const { tabs, splitTabId, closeSplit } = useEditorTabs(projectId);
  const splitTab = splitTabId
    ? tabs.find((tab) => tab.id === splitTabId)
    : null;

  return (
    <main className="flex h-full min-h-0 flex-col bg-ws-stage">
      <WorkspaceEditorTabs projectId={projectId} />
      {splitTab ? (
        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 flex-1"
          defaultLayout={{
            "editor-primary": 50,
            "editor-split": 50,
          }}
        >
          <ResizablePanel id="editor-primary" minSize="20%" defaultSize="50">
            <div className="h-full min-h-0 overflow-auto">
              <EditorPrimarySurface projectId={projectId}>
                {children}
              </EditorPrimarySurface>
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-1.5 bg-transparent after:hidden hover:bg-ws-accent/40" />
          <ResizablePanel id="editor-split" minSize="20%" defaultSize="50">
            <EditorSplitPane
              projectId={projectId}
              tab={splitTab}
              onClose={closeSplit}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <EditorPrimarySurface projectId={projectId}>
            {children}
          </EditorPrimarySurface>
        </div>
      )}
    </main>
  );
}
