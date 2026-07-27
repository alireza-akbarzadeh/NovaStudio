"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  usePanelRef,
  type Layout
} from "react-resizable-panels";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CloneFromGitHubDialog } from "@/features/github/components/clone-from-github-dialog";
import { useEditorSettingsSync } from "@/features/settings/hooks/use-editor-settings-sync";
import { useExtensionsSync } from "@/features/extensions/hooks/use-extensions-sync";
import { runCommand } from "@/features/workspace/commands/registry";
import { InitializeGitRepositoryDialog } from "@/features/workspace/components/initialize-git-repository-dialog";
import {
  WorkspaceLeftActivityBar,
  WorkspaceRightActivityBar,
} from "@/features/workspace/components/workspace-activity-bar";
import { WorkspaceAiSidebar } from "@/features/workspace/components/workspace-ai-sidebar";
import { WorkspaceBottomPanel } from "@/features/workspace/components/workspace-bottom-panel";
import { WorkspaceCommandPalette } from "@/features/workspace/components/workspace-command-palette";
import { WorkspaceEditorPanel } from "@/features/workspace/components/workspace-editor-panel";
import { WorkspaceGoToFileDialog } from "@/features/workspace/components/workspace-go-to-file-dialog";
import { RenameSymbolDialog } from "@/features/workspace/components/rename-symbol-dialog";
import { WorkspaceImportBanner } from "@/features/workspace/components/workspace-import-banner";
import { WorkspaceChatPanel } from "@/features/workspace/components/workspace-chat-panel";
import { WorkspaceCommentsPanel } from "@/features/workspace/components/workspace-comments-panel";
import { WorkspaceDeployPanel } from "@/features/workspace/components/workspace-deploy-panel";
import { WorkspaceGutterContextMenu } from "@/features/workspace/components/workspace-gutter-context-menu";
import { WorkspaceNotificationsPanel } from "@/features/workspace/components/workspace-notifications-panel";
import { WorkspaceSettingsDialog } from "@/features/workspace/components/workspace-settings-dialog";
import { WorkspaceSidebar } from "@/features/workspace/components/workspace-sidebar";
import { WorkspaceStatusBar } from "@/features/workspace/components/workspace-status-bar";
import { WorkspaceToolbar } from "@/features/workspace/components/workspace-toolbar";
import { ProjectFilesProvider } from "@/features/workspace/components/project-files-provider";
import { WebContainerProvider } from "@/features/workspace/components/webcontainer-provider";
import { PreviewServerProvider } from "@/features/workspace/components/preview-server-provider";
import { useCollapsiblePanelSync } from "@/features/workspace/hooks/use-collapsible-panel-sync";
import { useEditorTabsSync, useNewProjectTabShortcut, useUserJsonTabShortcut } from "@/features/workspace/hooks/use-editor-tabs";
import { useWebContainerAutoInstall } from "@/features/workspace/hooks/use-webcontainer-auto-install";
import { usePendingScaffold } from "@/features/workspace/hooks/use-pending-scaffold";
import { clearMemoryDraftsForOtherProjects } from "@/features/workspace/lib/file-content-drafts";
import { useWorkspacePrefsSync } from "@/features/workspace/hooks/use-workspace-prefs-sync";
import { useWorkspaceFocusSync } from "@/features/workspace/hooks/use-workspace-focus-sync";
import { useWorkspacePanelCleanup } from "@/features/workspace/hooks/use-workspace-panel-cleanup";
import { useWorkspaceShortcuts } from "@/features/workspace/hooks/use-workspace-shortcuts";
import {
  useWorkspaceStore,
  type PanelSizes,
} from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceLayoutProps = {
  projectId: string;
  projectName?: string;
  children: ReactNode;
};

const paneClass =
  "h-full min-h-0 overflow-hidden rounded-[10px] border border-ws-border-subtle bg-ws-panel shadow-[0_1px_0_color-mix(in_oklab,var(--ws-text)_4%,transparent)]";

const stagePaneClass =
  "h-full min-h-0 overflow-hidden rounded-[10px] border border-ws-border-subtle bg-ws-stage shadow-[0_1px_0_color-mix(in_oklab,var(--ws-text)_4%,transparent)]";

function WorkspaceLayoutInner({
  projectId,
  projectName,
  children,
}: WorkspaceLayoutProps) {
  useWorkspaceShortcuts();
  useWorkspacePrefsSync();
  useWorkspaceFocusSync(projectId);
  useWorkspacePanelCleanup(projectId);
  useEditorSettingsSync();
  useExtensionsSync();
  useEditorTabsSync(projectId);
  useNewProjectTabShortcut(projectId);
  useUserJsonTabShortcut(projectId);
  usePendingScaffold(projectId);
  useWebContainerAutoInstall(projectId);

  useEffect(() => {
    clearMemoryDraftsForOtherProjects(projectId);
  }, [projectId]);

  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const aiPanelOpen = useWorkspaceStore((s) => s.aiPanelOpen);
  const zenMode = useWorkspaceStore((s) => s.zenMode);
  const panelSizes = useWorkspaceStore((s) => s.panelSizes);
  const setPanelSizes = useWorkspaceStore((s) => s.setPanelSizes);
  const cloneFromGitHubOpen = useWorkspaceStore((s) => s.cloneFromGitHubOpen);
  const closeCloneFromGitHub = useWorkspaceStore((s) => s.closeCloneFromGitHub);

  const sidebarPanelRef = usePanelRef();
  const terminalPanelRef = usePanelRef();
  const aiPanelRef = usePanelRef();
  const isApplyingLayoutRef = useRef(false);

  useCollapsiblePanelSync({
    open: sidebarOpen,
    panelRef: sidebarPanelRef,
    sizeKey: "sidebar",
    isApplyingLayoutRef,
  });
  useCollapsiblePanelSync({
    open: terminalOpen,
    panelRef: terminalPanelRef,
    sizeKey: "terminal",
    isApplyingLayoutRef,
  });
  useCollapsiblePanelSync({
    open: aiPanelOpen,
    panelRef: aiPanelRef,
    sizeKey: "ai",
    isApplyingLayoutRef,
  });

  const onHorizontalLayoutChanged = (layout: Layout) => {
    if (isApplyingLayoutRef.current) return;

    const state = useWorkspaceStore.getState();
    const next: Partial<PanelSizes> = {};

    if (
      state.sidebarOpen &&
      typeof layout.sidebar === "number" &&
      layout.sidebar > 0
    ) {
      next.sidebar = layout.sidebar;
    }
    if (state.aiPanelOpen && typeof layout.ai === "number" && layout.ai > 0) {
      next.ai = layout.ai;
    }
    if (Object.keys(next).length > 0) setPanelSizes(next);
  };

  const onVerticalLayoutChanged = (layout: Layout) => {
    if (isApplyingLayoutRef.current) return;

    const state = useWorkspaceStore.getState();
    const terminal = layout.terminal;
    if (
      state.terminalOpen &&
      typeof terminal === "number" &&
      terminal > 0
    ) {
      setPanelSizes({ terminal });
    }
  };

  const sidebarDefault = sidebarOpen ? panelSizes.sidebar : 0;
  const aiDefault = aiPanelOpen ? panelSizes.ai : 0;
  const terminalDefault = terminalOpen ? panelSizes.terminal : 0;
  const editorDefault = Math.max(30, 100 - sidebarDefault - aiDefault);

  return (
    <div className="ws-chrome flex h-dvh w-full flex-col bg-ws-bg text-ws-text-secondary">
      {!zenMode ? (
        <WorkspaceToolbar projectId={projectId} projectName={projectName} />
      ) : null}
      {!zenMode ? <WorkspaceImportBanner projectId={projectId} /> : null}

      <div
        className={cn(
          "relative flex min-h-0 flex-1 gap-0.5",
          zenMode ? "px-0 pb-0" : "px-1 pb-1.5",
        )}
      >
        {!zenMode ? <WorkspaceLeftActivityBar /> : null}

        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-0 min-w-0 flex-1"
          defaultLayout={{
            sidebar: sidebarDefault,
            editor: editorDefault,
            ai: aiDefault,
          }}
          onLayoutChanged={onHorizontalLayoutChanged}
        >
          <ResizablePanel
            id="sidebar"
            panelRef={sidebarPanelRef}
            collapsible
            collapsedSize={0}
            minSize="12%"
            defaultSize={`${sidebarDefault}`}
            className={cn(!sidebarOpen && "pointer-events-none")}
          >
            <div className={cn(paneClass, "mr-0")}>
              <WorkspaceSidebar projectId={projectId} />
            </div>
          </ResizablePanel>

          <ResizableHandle
            className={cn(
              "w-1.5 bg-transparent after:hidden hover:bg-ws-accent/40 aria-[orientation=vertical]:w-1.5",
              !sidebarOpen && "pointer-events-none opacity-0",
            )}
          />

          <ResizablePanel id="editor" minSize="30%" className="min-w-0">
            <ResizablePanelGroup
              orientation="vertical"
              className="h-full min-h-0 flex-1"
              defaultLayout={{
                main: 100 - terminalDefault,
                terminal: terminalDefault,
              }}
              onLayoutChanged={onVerticalLayoutChanged}
            >
              <ResizablePanel id="main" minSize="20%" className="min-h-0">
                <div
                  className={cn(
                    stagePaneClass,
                    zenMode && "rounded-none border-0 shadow-none",
                  )}
                >
                  <WorkspaceEditorPanel projectId={projectId}>
                    {children}
                  </WorkspaceEditorPanel>
                </div>
              </ResizablePanel>

              <ResizableHandle
                className={cn(
                  // Match sidebar↔editor gutter (w-1.5). Base handle uses
                  // aria-[orientation=horizontal]:h-px which would collapse this.
                  "h-1.5 w-full bg-transparent after:hidden hover:bg-ws-accent/40 aria-[orientation=horizontal]:h-1.5",
                  !terminalOpen && "pointer-events-none opacity-0",
                )}
              />

              <ResizablePanel
                id="terminal"
                panelRef={terminalPanelRef}
                collapsible
                collapsedSize={0}
                minSize="15%"
                defaultSize={`${terminalDefault}`}
                className={cn(!terminalOpen && "pointer-events-none")}
              >
                <div className={paneClass}>
                  <WorkspaceBottomPanel projectId={projectId} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle
            className={cn(
              "w-1.5 bg-transparent after:hidden hover:bg-ws-accent/40 aria-[orientation=vertical]:w-1.5",
              !aiPanelOpen && "pointer-events-none opacity-0",
            )}
          />

          <ResizablePanel
            id="ai"
            panelRef={aiPanelRef}
            collapsible
            collapsedSize={0}
            minSize="18%"
            defaultSize={`${aiDefault}`}
            className={cn(!aiPanelOpen && "pointer-events-none")}
          >
            <div className={paneClass}>
              <WorkspaceAiSidebar
                projectId={projectId}
                projectName={projectName}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <WorkspaceChatPanel projectId={projectId} />
        <WorkspaceCommentsPanel projectId={projectId} />
        <WorkspaceGutterContextMenu projectId={projectId} />
        <WorkspaceNotificationsPanel />
        <WorkspaceDeployPanel projectId={projectId} />
        {!zenMode ? <WorkspaceRightActivityBar projectId={projectId} /> : null}

        {zenMode ? (
          <button
            type="button"
            onClick={() => runCommand("toggleZenMode")}
            className="absolute top-3 right-3 z-20 rounded-lg border border-ws-border-subtle bg-ws-panel/95 px-2.5 py-1.5 text-[11px] font-medium text-ws-text-muted shadow-sm backdrop-blur-sm transition-colors hover:border-ws-border hover:bg-ws-hover hover:text-ws-text"
            title="Exit zen mode"
          >
            Exit Zen
          </button>
        ) : null}
      </div>

      <WorkspaceSettingsDialog />
      <WorkspaceCommandPalette projectId={projectId} />
      <WorkspaceGoToFileDialog projectId={projectId} />
      <RenameSymbolDialog projectId={projectId} />
      <InitializeGitRepositoryDialog projectId={projectId} />
      <CloneFromGitHubDialog
        open={cloneFromGitHubOpen}
        onOpenChange={(open) => {
          if (!open) closeCloneFromGitHub();
        }}
      />
      {!zenMode ? <WorkspaceStatusBar projectId={projectId} /> : null}
    </div>
  );
}

export function WorkspaceLayout(props: WorkspaceLayoutProps) {
  return (
    <ProjectFilesProvider projectId={props.projectId}>
      <WebContainerProvider projectId={props.projectId}>
        <PreviewServerProvider projectId={props.projectId}>
          <WorkspaceLayoutInner {...props} />
        </PreviewServerProvider>
      </WebContainerProvider>
    </ProjectFilesProvider>
  );
}
