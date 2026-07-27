import { create } from "zustand";

export type PanelSizes = {
  sidebar: number;
  terminal: number;
  ai: number;
};

export type LeftPanelView =
  | "explorer"
  | "search"
  | "git"
  | "outline"
  | "dependencies"
  | "extensions"
  | "activity";

export type ExplorerTab = "project" | "changes" | "quality";

export type GitPanelTab = "changes" | "stashes" | "history" | "github" | "info";

export type BottomPanelTab =
  | "terminal"
  | "problems"
  | "debug"
  | "performance"
  | "console";

export type EditorPanelView = "code" | "preview";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export type WorkspacePrefs = {
  sidebarOpen: boolean;
  terminalOpen: boolean;
  aiPanelOpen: boolean;
  panelSizes: PanelSizes;
};

/** Layout snapshot restored when leaving Zen / Focus mode. */
export type ZenSnapshot = {
  sidebarOpen: boolean;
  terminalOpen: boolean;
  aiPanelOpen: boolean;
  chatPanelOpen: boolean;
  commentsPanelOpen: boolean;
  notificationsPanelOpen: boolean;
  deployPanelOpen: boolean;
};

export type TreeClipboard = {
  mode: "cut" | "copy";
  projectId: string;
  path: string;
};

export type EditorRevealTarget = {
  path: string;
  line: number;
  column: number;
  matchLength?: number;
};

export type SearchPanelMode = "text" | "file";

export type FileTreeProjectState = {
  openFolderIds: string[];
  treeFilter: string;
  focusedId: string | null;
  selectedIds: string[];
  selectionAnchorId: string | null;
};

export const DEFAULT_FILE_TREE_STATE: FileTreeProjectState = {
  openFolderIds: [],
  treeFilter: "",
  focusedId: null,
  selectedIds: [],
  selectionAnchorId: null,
};

export type EditorTabKind =
  | "welcome"
  | "file"
  | "diff"
  | "activity-diff"
  | "settings"
  | "shortcuts"
  | "user-json"
  | "new-project";

export type EditorTab = {
  id: string;
  kind: EditorTabKind;
  title: string;
  path?: string;
  /** Activity timeline snapshot id (for `activity-diff` tabs). */
  activityId?: string;
  /** Transient tab — italic; replaced by the next preview open. */
  preview?: boolean;
  /** Sticky tab — stays left; survives preview replacement. */
  pinned?: boolean;
};

export type EditorTabOpenMode = "preview" | "permanent" | "preserve";

type WorkspaceState = WorkspacePrefs & {
  settingsOpen: boolean;
  notificationsPanelOpen: boolean;
  chatPanelOpen: boolean;
  commentsPanelOpen: boolean;
  deployPanelOpen: boolean;
  /** Selected line-comment thread in the comments panel. */
  activeCommentThreadId: string | null;
  /** Draft line for creating a new comment (from glyph / command). */
  commentDraftLine: number | null;
  /** Right-click gutter menu (breakpoint / comment). */
  gutterContextMenu: {
    x: number;
    y: number;
    line: number;
    filePath: string;
  } | null;
  goToFileOpen: boolean;
  commandPaletteOpen: boolean;
  gitInitDialogOpen: boolean;
  cloneFromGitHubOpen: boolean;
  branchPickerOpen: boolean;
  leftPanelView: LeftPanelView;
  explorerTab: ExplorerTab;
  gitPanelTab: GitPanelTab;
  bottomPanelTab: BottomPanelTab;
  currentFilePath: string | null;
  editorTabs: EditorTab[];
  activeEditorTabId: string | null;
  editorTabsProjectId: string | null;
  /** Tab shown in the secondary editor pane when split is open. */
  editorSplitTabId: string | null;
  newProjectRequest: number;
  userJsonRequest: number;
  hydrated: boolean;
  breadcrumb: BreadcrumbSegment[];
  treeClipboard: TreeClipboard | null;
  pendingChatAttachPaths: string[] | null;
  requestNewChat: boolean;
  terminalCwdRequest: string | null;
  terminalCommandRequest: string | null;
  pendingEditorReveal: EditorRevealTarget | null;
  searchFolderScope: string | null;
  searchPanelMode: SearchPanelMode;
  fileTreeByProject: Record<string, FileTreeProjectState>;
  /** Bumped when a panel requests the file tree to collapse (memory cleanup). */
  fileTreeCollapseSeqByProject: Record<string, number>;
  /** Distraction-free layout — hides chrome and centers the editor. */
  zenMode: boolean;
  zenSnapshot: ZenSnapshot | null;
  /** Code vs Preview tab for the active file (Live Share focus). */
  editorPanelView: EditorPanelView;
  /** Preview iframe path (e.g. `/about`) for Live Share follow. */
  previewUrlPath: string;
  /** Last known terminal cwd for Live Share follow. */
  terminalCwd: string | null;
  /** User id currently being followed (null = not following). */
  followingUserId: string | null;

  toggleSidebar: () => void;
  toggleTerminal: () => void;
  showProblemsPanel: () => void;
  showDebugPanel: () => void;
  showPerformancePanel: () => void;
  showConsolePanel: () => void;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  toggleAiPanel: () => void;
  toggleNotificationsPanel: () => void;
  openNotificationsPanel: () => void;
  closeNotificationsPanel: () => void;
  toggleChatPanel: () => void;
  openChatPanel: () => void;
  closeChatPanel: () => void;
  toggleCommentsPanel: () => void;
  openCommentsPanel: () => void;
  closeCommentsPanel: () => void;
  toggleDeployPanel: () => void;
  openDeployPanel: () => void;
  closeDeployPanel: () => void;
  setActiveCommentThreadId: (id: string | null) => void;
  setCommentDraftLine: (line: number | null) => void;
  openGutterContextMenu: (menu: {
    x: number;
    y: number;
    line: number;
    filePath: string;
  }) => void;
  closeGutterContextMenu: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  openGoToFile: () => void;
  closeGoToFile: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openGitInitDialog: () => void;
  closeGitInitDialog: () => void;
  openCloneFromGitHub: () => void;
  closeCloneFromGitHub: () => void;
  openBranchPicker: () => void;
  setBranchPickerOpen: (open: boolean) => void;
  setLeftPanelView: (view: LeftPanelView) => void;
  setExplorerTab: (tab: ExplorerTab) => void;
  setGitPanelTab: (tab: GitPanelTab) => void;
  showGitPanel: (tab?: GitPanelTab) => void;
  showCodeQualityPanel: () => void;
  setCurrentFilePath: (path: string | null) => void;
  syncEditorTabFromRoute: (
    projectId: string,
    tab: EditorTab,
    options?: { mode?: EditorTabOpenMode },
  ) => void;
  activateEditorTab: (id: string) => void;
  closeEditorTab: (id: string) => EditorTab | null;
  /** Close every editor tab; returns null (empty editor). */
  closeAllEditorTabs: () => null;
  /**
   * Close tabs without a "kept open" signal: preview tabs and unpinned
   * non-file tabs. Pinned + permanent file tabs stay.
   */
  closeUnmodifiedEditorTabs: () => EditorTab | null;
  /** Pin every currently open tab. */
  bookmarkOpenEditorTabs: () => void;
  reorderEditorTabs: (fromId: string, toId: string) => void;
  pinEditorTab: (id: string) => void;
  unpinEditorTab: (id: string) => void;
  promotePreviewTab: (id: string) => void;
  promotePreviewTabByPath: (path: string) => void;
  openEditorSplit: (tabId: string) => void;
  closeEditorSplit: () => void;
  resetEditorTabs: (projectId: string) => void;
  requestOpenNewProject: () => void;
  requestOpenUserJson: () => void;
  setPanelSizes: (sizes: Partial<PanelSizes>) => void;
  setBreadcrumb: (segments: BreadcrumbSegment[]) => void;
  setTreeClipboard: (clipboard: TreeClipboard | null) => void;
  clearTreeClipboard: () => void;
  setPendingChatAttachPaths: (paths: string[] | null) => void;
  requestNewAiChat: () => void;
  clearRequestNewChat: () => void;
  requestTerminalCwd: (cwd: string) => void;
  clearTerminalCwdRequest: () => void;
  requestTerminalCommand: (command: string) => void;
  clearTerminalCommandRequest: () => void;
  setPendingEditorReveal: (target: EditorRevealTarget | null) => void;
  clearPendingEditorReveal: () => void;
  setSearchFolderScope: (path: string | null) => void;
  setSearchPanelMode: (mode: SearchPanelMode) => void;
  setFileTreeState: (
    projectId: string,
    patch: Partial<FileTreeProjectState>,
  ) => void;
  getFileTreeState: (projectId: string) => FileTreeProjectState;
  collapseFileTree: (projectId: string) => void;
  openFindInFiles: (options?: {
    folderScope?: string | null;
    mode?: SearchPanelMode;
  }) => void;
  enterZenMode: () => void;
  exitZenMode: () => void;
  toggleZenMode: () => void;
  setEditorPanelView: (view: EditorPanelView) => void;
  setPreviewUrlPath: (path: string) => void;
  setTerminalCwd: (cwd: string | null) => void;
  setFollowingUserId: (userId: string | null) => void;
  hydrate: (prefs: Partial<WorkspacePrefs>) => void;
  getPersistablePrefs: () => WorkspacePrefs;
};

export const DEFAULT_PANEL_SIZES: PanelSizes = {
  sidebar: 18,
  terminal: 28,
  ai: 28,
};

export const DEFAULT_WORKSPACE_PREFS: WorkspacePrefs = {
  sidebarOpen: true,
  terminalOpen: false,
  aiPanelOpen: true,
  panelSizes: DEFAULT_PANEL_SIZES,
};

export const LEFT_PANEL_LABELS: Record<LeftPanelView, string> = {
  explorer: "Explorer",
  search: "Find in Files",
  git: "Git",
  outline: "Outline",
  dependencies: "Dependencies",
  extensions: "Extensions",
  activity: "Activity",
};

function lastPinnedIndex(tabs: EditorTab[]): number {
  let index = -1;
  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i]?.pinned) index = i;
  }
  return index;
}

function insertEditorTab(tabs: EditorTab[], tab: EditorTab): EditorTab[] {
  const next = [...tabs];
  if (tab.pinned) {
    const insertAt = lastPinnedIndex(next) + 1;
    next.splice(insertAt, 0, tab);
    return next;
  }
  const insertAt = lastPinnedIndex(next) + 1;
  // Preview tabs sit right after pinned (VS Code: one preview slot there).
  next.splice(insertAt, 0, tab);
  return next;
}

function openEditorTabs(
  tabs: EditorTab[],
  tab: EditorTab,
  mode: EditorTabOpenMode,
): EditorTab[] {
  const existing = tabs.find((t) => t.id === tab.id);
  if (existing) {
    if (mode === "preserve") return tabs;
    if (mode === "permanent") {
      return tabs.map((t) =>
        t.id === tab.id ? { ...t, preview: false } : t,
      );
    }
    // preview mode on existing: keep permanent/pinned as-is
    return tabs;
  }

  const canPreview = tab.kind === "file" && mode === "preview";
  let next = tabs;
  if (canPreview) {
    next = tabs.filter((t) => !t.preview);
  }

  const opened: EditorTab = {
    ...tab,
    preview: canPreview,
    pinned: false,
  };
  return insertEditorTab(next, opened);
}

function movePinnedTab(tabs: EditorTab[], id: string, pinned: boolean): EditorTab[] {
  const current = tabs.find((t) => t.id === id);
  if (!current || Boolean(current.pinned) === pinned) {
    return tabs.map((t) =>
      t.id === id ? { ...t, pinned, preview: pinned ? false : t.preview } : t,
    );
  }

  const without = tabs.filter((t) => t.id !== id);
  const updated: EditorTab = {
    ...current,
    pinned,
    preview: pinned ? false : current.preview,
  };
  return insertEditorTab(without, updated);
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...DEFAULT_WORKSPACE_PREFS,
  settingsOpen: false,
  notificationsPanelOpen: false,
  chatPanelOpen: false,
  commentsPanelOpen: false,
  deployPanelOpen: false,
  activeCommentThreadId: null,
  commentDraftLine: null,
  gutterContextMenu: null,
  goToFileOpen: false,
  commandPaletteOpen: false,
  gitInitDialogOpen: false,
  cloneFromGitHubOpen: false,
  branchPickerOpen: false,
  leftPanelView: "explorer",
  explorerTab: "project",
  gitPanelTab: "changes",
  bottomPanelTab: "terminal",
  currentFilePath: null,
  editorTabs: [],
  activeEditorTabId: null,
  editorTabsProjectId: null,
  editorSplitTabId: null,
  newProjectRequest: 0,
  userJsonRequest: 0,
  hydrated: false,
  breadcrumb: [
    { label: "src" },
    { label: "app" },
    { label: "page.tsx" },
  ],
  treeClipboard: null,
  pendingChatAttachPaths: null,
  requestNewChat: false,
  terminalCwdRequest: null,
  terminalCommandRequest: null,
  pendingEditorReveal: null,
  searchFolderScope: null,
  searchPanelMode: "text",
  fileTreeByProject: {},
  fileTreeCollapseSeqByProject: {},
  zenMode: false,
  zenSnapshot: null,
  editorPanelView: "code",
  previewUrlPath: "/",
  terminalCwd: null,
  followingUserId: null,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleTerminal: () =>
    set((s) => {
      if (s.terminalOpen && s.bottomPanelTab === "terminal") {
        return { terminalOpen: false };
      }
      return { terminalOpen: true, bottomPanelTab: "terminal" };
    }),
  showProblemsPanel: () =>
    set((s) => {
      if (s.terminalOpen && s.bottomPanelTab === "problems") {
        return { terminalOpen: false };
      }
      return { terminalOpen: true, bottomPanelTab: "problems" };
    }),
  showDebugPanel: () =>
    set((s) => {
      if (s.terminalOpen && s.bottomPanelTab === "debug") {
        return { terminalOpen: false };
      }
      return { terminalOpen: true, bottomPanelTab: "debug" };
    }),
  showPerformancePanel: () =>
    set((s) => {
      if (s.terminalOpen && s.bottomPanelTab === "performance") {
        return { terminalOpen: false };
      }
      return { terminalOpen: true, bottomPanelTab: "performance" };
    }),
  showConsolePanel: () =>
    set((s) => {
      if (s.terminalOpen && s.bottomPanelTab === "console") {
        return { terminalOpen: false };
      }
      return { terminalOpen: true, bottomPanelTab: "console" };
    }),
  setBottomPanelTab: (tab) =>
    set({ bottomPanelTab: tab, terminalOpen: true }),
  toggleAiPanel: () =>
    set((s) => {
      const nextOpen = !s.aiPanelOpen;
      return {
        aiPanelOpen: nextOpen,
        ...(nextOpen
          ? {
              chatPanelOpen: false,
              notificationsPanelOpen: false,
              commentsPanelOpen: false,
              deployPanelOpen: false,
            }
          : {}),
      };
    }),
  toggleNotificationsPanel: () =>
    set((s) => {
      const nextOpen = !s.notificationsPanelOpen;
      return {
        notificationsPanelOpen: nextOpen,
        ...(nextOpen
          ? {
              chatPanelOpen: false,
              aiPanelOpen: false,
              commentsPanelOpen: false,
              deployPanelOpen: false,
            }
          : {}),
      };
    }),
  openNotificationsPanel: () =>
    set({
      notificationsPanelOpen: true,
      chatPanelOpen: false,
      aiPanelOpen: false,
      commentsPanelOpen: false,
      deployPanelOpen: false,
    }),
  closeNotificationsPanel: () => set({ notificationsPanelOpen: false }),
  toggleChatPanel: () =>
    set((s) => {
      const nextOpen = !s.chatPanelOpen;
      return {
        chatPanelOpen: nextOpen,
        ...(nextOpen
          ? {
              notificationsPanelOpen: false,
              aiPanelOpen: false,
              commentsPanelOpen: false,
              deployPanelOpen: false,
            }
          : {}),
      };
    }),
  openChatPanel: () =>
    set({
      chatPanelOpen: true,
      notificationsPanelOpen: false,
      aiPanelOpen: false,
      commentsPanelOpen: false,
      deployPanelOpen: false,
    }),
  closeChatPanel: () => set({ chatPanelOpen: false }),
  toggleCommentsPanel: () =>
    set((s) => {
      const nextOpen = !s.commentsPanelOpen;
      return {
        commentsPanelOpen: nextOpen,
        ...(nextOpen
          ? {
              notificationsPanelOpen: false,
              aiPanelOpen: false,
              chatPanelOpen: false,
              deployPanelOpen: false,
            }
          : { activeCommentThreadId: null, commentDraftLine: null }),
      };
    }),
  openCommentsPanel: () =>
    set({
      commentsPanelOpen: true,
      notificationsPanelOpen: false,
      aiPanelOpen: false,
      chatPanelOpen: false,
      deployPanelOpen: false,
    }),
  closeCommentsPanel: () =>
    set({
      commentsPanelOpen: false,
      activeCommentThreadId: null,
      commentDraftLine: null,
    }),
  toggleDeployPanel: () =>
    set((s) => {
      const nextOpen = !s.deployPanelOpen;
      return {
        deployPanelOpen: nextOpen,
        ...(nextOpen
          ? {
              notificationsPanelOpen: false,
              aiPanelOpen: false,
              chatPanelOpen: false,
              commentsPanelOpen: false,
            }
          : {}),
      };
    }),
  openDeployPanel: () =>
    set({
      deployPanelOpen: true,
      notificationsPanelOpen: false,
      aiPanelOpen: false,
      chatPanelOpen: false,
      commentsPanelOpen: false,
    }),
  closeDeployPanel: () => set({ deployPanelOpen: false }),
  setActiveCommentThreadId: (id) => set({ activeCommentThreadId: id }),
  setCommentDraftLine: (line) => set({ commentDraftLine: line }),
  openGutterContextMenu: (menu) => set({ gutterContextMenu: menu }),
  closeGutterContextMenu: () => set({ gutterContextMenu: null }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
  openGoToFile: () => set({ goToFileOpen: true }),
  closeGoToFile: () => set({ goToFileOpen: false }),
  openCommandPalette: () =>
    set({
      commandPaletteOpen: true,
      goToFileOpen: false,
      settingsOpen: false,
    }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openGitInitDialog: () => set({ gitInitDialogOpen: true }),
  closeGitInitDialog: () => set({ gitInitDialogOpen: false }),
  openCloneFromGitHub: () => set({ cloneFromGitHubOpen: true }),
  closeCloneFromGitHub: () => set({ cloneFromGitHubOpen: false }),
  openBranchPicker: () => set({ branchPickerOpen: true }),
  setBranchPickerOpen: (open) => set({ branchPickerOpen: open }),
  setLeftPanelView: (view) =>
    set({ leftPanelView: view, sidebarOpen: true }),
  setExplorerTab: (tab) => set({ explorerTab: tab }),
  setGitPanelTab: (tab) => set({ gitPanelTab: tab }),
  showGitPanel: (tab) =>
    set({
      leftPanelView: "git",
      sidebarOpen: true,
      ...(tab ? { gitPanelTab: tab } : {}),
    }),
  showCodeQualityPanel: () =>
    set({
      leftPanelView: "explorer",
      explorerTab: "quality",
      sidebarOpen: true,
    }),
  setCurrentFilePath: (path) => set({ currentFilePath: path }),
  syncEditorTabFromRoute: (projectId, tab, options) =>
    set((s) => {
      const mode = options?.mode ?? "preserve";
      const projectChanged = s.editorTabsProjectId !== projectId;
      const tabs = projectChanged ? [] : s.editorTabs;
      return {
        editorTabsProjectId: projectId,
        editorTabs: openEditorTabs(tabs, tab, mode),
        activeEditorTabId: tab.id,
        ...(projectChanged ? { editorSplitTabId: null } : {}),
      };
    }),
  activateEditorTab: (id) => set({ activeEditorTabId: id }),
  closeEditorTab: (id) => {
    const { editorTabs, activeEditorTabId, editorSplitTabId } = get();
    const index = editorTabs.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const nextTabs = editorTabs.filter((t) => t.id !== id);
    let nextActive: EditorTab | null = null;

    if (activeEditorTabId === id) {
      nextActive =
        nextTabs[Math.min(index, nextTabs.length - 1)] ?? null;
    } else {
      nextActive =
        nextTabs.find((t) => t.id === activeEditorTabId) ?? null;
    }

    set({
      editorTabs: nextTabs,
      activeEditorTabId: nextActive?.id ?? null,
      editorSplitTabId: editorSplitTabId === id ? null : editorSplitTabId,
    });

    return nextActive;
  },
  closeAllEditorTabs: () => {
    set({
      editorTabs: [],
      activeEditorTabId: null,
      editorSplitTabId: null,
    });
    return null;
  },
  closeUnmodifiedEditorTabs: () => {
    const { editorTabs, activeEditorTabId, editorSplitTabId } = get();
    const nextTabs = editorTabs.filter((tab) => {
      if (tab.pinned) return true;
      // Preview = transient / unmodified intent; permanent files stay.
      if (tab.preview) return false;
      if (tab.kind === "file") return true;
      return false;
    });

    if (nextTabs.length === editorTabs.length) {
      return editorTabs.find((t) => t.id === activeEditorTabId) ?? null;
    }

    const nextActive =
      nextTabs.find((t) => t.id === activeEditorTabId) ??
      nextTabs[nextTabs.length - 1] ??
      null;

    set({
      editorTabs: nextTabs,
      activeEditorTabId: nextActive?.id ?? null,
      editorSplitTabId:
        editorSplitTabId && nextTabs.some((t) => t.id === editorSplitTabId)
          ? editorSplitTabId
          : null,
    });

    return nextActive;
  },
  bookmarkOpenEditorTabs: () =>
    set((s) => {
      let tabs = s.editorTabs;
      for (const tab of s.editorTabs) {
        if (!tab.pinned) {
          tabs = movePinnedTab(tabs, tab.id, true);
        }
      }
      return { editorTabs: tabs };
    }),
  reorderEditorTabs: (fromId, toId) =>
    set((s) => {
      if (fromId === toId) return s;
      const fromIndex = s.editorTabs.findIndex((t) => t.id === fromId);
      const toIndex = s.editorTabs.findIndex((t) => t.id === toId);
      if (fromIndex === -1 || toIndex === -1) return s;

      const fromTab = s.editorTabs[fromIndex];
      const toTab = s.editorTabs[toIndex];
      if (!fromTab || !toTab) return s;
      // Keep pinned and unpinned groups separate.
      if (Boolean(fromTab.pinned) !== Boolean(toTab.pinned)) return s;

      const nextTabs = [...s.editorTabs];
      const [moved] = nextTabs.splice(fromIndex, 1);
      if (!moved) return s;
      nextTabs.splice(toIndex, 0, moved);
      return { editorTabs: nextTabs };
    }),
  pinEditorTab: (id) =>
    set((s) => ({ editorTabs: movePinnedTab(s.editorTabs, id, true) })),
  unpinEditorTab: (id) =>
    set((s) => ({ editorTabs: movePinnedTab(s.editorTabs, id, false) })),
  promotePreviewTab: (id) =>
    set((s) => ({
      editorTabs: s.editorTabs.map((t) =>
        t.id === id ? { ...t, preview: false } : t,
      ),
    })),
  promotePreviewTabByPath: (path) =>
    set((s) => ({
      editorTabs: s.editorTabs.map((t) =>
        t.kind === "file" && t.path === path && t.preview
          ? { ...t, preview: false }
          : t,
      ),
    })),
  openEditorSplit: (tabId) => {
    const exists = get().editorTabs.some((t) => t.id === tabId);
    if (!exists) return;
    set({ editorSplitTabId: tabId });
  },
  closeEditorSplit: () => set({ editorSplitTabId: null }),
  resetEditorTabs: (projectId) =>
    set({
      editorTabs: [],
      activeEditorTabId: null,
      editorTabsProjectId: projectId,
      editorSplitTabId: null,
    }),
  requestOpenNewProject: () =>
    set((s) => ({ newProjectRequest: s.newProjectRequest + 1 })),
  requestOpenUserJson: () =>
    set((s) => ({ userJsonRequest: s.userJsonRequest + 1 })),
  setPanelSizes: (sizes) =>
    set((s) => ({
      panelSizes: { ...s.panelSizes, ...sizes },
    })),
  setBreadcrumb: (segments) => set({ breadcrumb: segments }),
  setTreeClipboard: (clipboard) => set({ treeClipboard: clipboard }),
  clearTreeClipboard: () => set({ treeClipboard: null }),
  setPendingChatAttachPaths: (paths) =>
    set({ pendingChatAttachPaths: paths }),
  requestNewAiChat: () => set({ requestNewChat: true }),
  clearRequestNewChat: () => set({ requestNewChat: false }),
  requestTerminalCwd: (cwd) =>
    set({
      terminalCwdRequest: cwd,
      terminalOpen: true,
      bottomPanelTab: "terminal",
    }),
  clearTerminalCwdRequest: () => set({ terminalCwdRequest: null }),
  requestTerminalCommand: (command) =>
    set({
      terminalCommandRequest: command,
      terminalOpen: true,
      bottomPanelTab: "terminal",
    }),
  clearTerminalCommandRequest: () => set({ terminalCommandRequest: null }),
  setPendingEditorReveal: (target) => set({ pendingEditorReveal: target }),
  clearPendingEditorReveal: () => set({ pendingEditorReveal: null }),
  setSearchFolderScope: (path) => set({ searchFolderScope: path }),
  setSearchPanelMode: (mode) => set({ searchPanelMode: mode }),
  setFileTreeState: (projectId, patch) =>
    set((s) => ({
      fileTreeByProject: {
        ...s.fileTreeByProject,
        [projectId]: {
          ...DEFAULT_FILE_TREE_STATE,
          ...s.fileTreeByProject[projectId],
          ...patch,
        },
      },
    })),
  getFileTreeState: (projectId) => {
    const state = get().fileTreeByProject[projectId];
    return state ?? DEFAULT_FILE_TREE_STATE;
  },
  collapseFileTree: (projectId) =>
    set((s) => ({
      fileTreeByProject: {
        ...s.fileTreeByProject,
        [projectId]: {
          ...DEFAULT_FILE_TREE_STATE,
          ...s.fileTreeByProject[projectId],
          openFolderIds: [],
        },
      },
      fileTreeCollapseSeqByProject: {
        ...s.fileTreeCollapseSeqByProject,
        [projectId]: (s.fileTreeCollapseSeqByProject[projectId] ?? 0) + 1,
      },
    })),
  openFindInFiles: (options) =>
    set({
      leftPanelView: "search",
      sidebarOpen: true,
      searchFolderScope: options?.folderScope ?? null,
      searchPanelMode: options?.mode ?? "text",
    }),
  enterZenMode: () =>
    set((s) => {
      if (s.zenMode) return s;
      return {
        zenMode: true,
        zenSnapshot: {
          sidebarOpen: s.sidebarOpen,
          terminalOpen: s.terminalOpen,
          aiPanelOpen: s.aiPanelOpen,
          chatPanelOpen: s.chatPanelOpen,
          commentsPanelOpen: s.commentsPanelOpen,
          notificationsPanelOpen: s.notificationsPanelOpen,
          deployPanelOpen: s.deployPanelOpen,
        },
        sidebarOpen: false,
        terminalOpen: false,
        aiPanelOpen: false,
        chatPanelOpen: false,
        commentsPanelOpen: false,
        notificationsPanelOpen: false,
        deployPanelOpen: false,
        activeCommentThreadId: null,
        commentDraftLine: null,
      };
    }),
  exitZenMode: () =>
    set((s) => {
      if (!s.zenMode) return s;
      const snap = s.zenSnapshot;
      return {
        zenMode: false,
        zenSnapshot: null,
        sidebarOpen: snap?.sidebarOpen ?? s.sidebarOpen,
        terminalOpen: snap?.terminalOpen ?? s.terminalOpen,
        aiPanelOpen: snap?.aiPanelOpen ?? s.aiPanelOpen,
        chatPanelOpen: snap?.chatPanelOpen ?? false,
        commentsPanelOpen: snap?.commentsPanelOpen ?? false,
        notificationsPanelOpen: snap?.notificationsPanelOpen ?? false,
        deployPanelOpen: snap?.deployPanelOpen ?? false,
      };
    }),
  toggleZenMode: () => {
    const s = get();
    if (s.zenMode) s.exitZenMode();
    else s.enterZenMode();
  },
  setEditorPanelView: (view) => set({ editorPanelView: view }),
  setPreviewUrlPath: (path) => set({ previewUrlPath: path }),
  setTerminalCwd: (cwd) => set({ terminalCwd: cwd }),
  setFollowingUserId: (userId) => set({ followingUserId: userId }),
  hydrate: (prefs) =>
    set((s) => {
      // Don't clobber an in-session zen layout with server prefs.
      if (s.zenMode) {
        return { hydrated: true };
      }
      return {
        sidebarOpen: prefs.sidebarOpen ?? s.sidebarOpen,
        terminalOpen: prefs.terminalOpen ?? s.terminalOpen,
        aiPanelOpen: prefs.aiPanelOpen ?? s.aiPanelOpen,
        panelSizes: prefs.panelSizes
          ? { ...s.panelSizes, ...prefs.panelSizes }
          : s.panelSizes,
        hydrated: true,
      };
    }),
  getPersistablePrefs: () => {
    const {
      sidebarOpen,
      terminalOpen,
      aiPanelOpen,
      panelSizes,
      zenMode,
      zenSnapshot,
    } = get();
    if (zenMode && zenSnapshot) {
      return {
        sidebarOpen: zenSnapshot.sidebarOpen,
        terminalOpen: zenSnapshot.terminalOpen,
        aiPanelOpen: zenSnapshot.aiPanelOpen,
        panelSizes,
      };
    }
    return { sidebarOpen, terminalOpen, aiPanelOpen, panelSizes };
  },
}));
