import {
  closeInlineAiEdit,
  isMonacoEditorTarget,
  requestInlineAiEdit,
} from "@/features/workspace/lib/monaco-inline-ai-edit";
import { isFileNavigatorEditing } from "@/features/workspace/components/file-navigator/file-navigator-edit-guard";
import {
  useWorkspaceStore,
  type GitPanelTab,
  type LeftPanelView,
} from "@/features/workspace/store/workspace-store";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { isLiveblocksConfigured } from "@/features/workspace/lib/liveblocks-configured";
import { isApplePlatform } from "@/lib/keyboard";
import { toast } from "sonner";
import {
  runFindReferences,
  runRenameSymbol,
} from "@/features/workspace/lib/symbol-refactor-actions";

export type CommandId =
  | "toggleSidebar"
  | "toggleTerminal"
  | "showProblems"
  | "showReferences"
  | "showDebug"
  | "showConsole"
  | "showPerformance"
  | "toggleAiPanel"
  | "toggleNotifications"
  | "toggleChatPanel"
  | "toggleCommentsPanel"
  | "toggleDeployPanel"
  | "openSettings"
  | "toggleSettings"
  | "closeSettings"
  | "openUserJson"
  | "openGoToFile"
  | "closeGoToFile"
  | "openGoToSymbol"
  | "closeGoToSymbol"
  | "openCommandPalette"
  | "closeCommandPalette"
  | "openCloneFromGitHub"
  | "openNewProject"
  | "showExplorer"
  | "showSearch"
  | "showGit"
  | "showCodeQuality"
  | "showOutline"
  | "showDependencies"
  | "showEnv"
  | "showExtensions"
  | "showActivity"
  | "showGitChanges"
  | "showGitHistory"
  | "findInFiles"
  | "formatDocument"
  | "saveFile"
  | "saveAllFiles"
  | "inlineAiEdit"
  | "toggleLiveCollaboration"
  | "toggleZenMode"
  | "toggleBlame"
  | "findReferences"
  | "renameSymbol";

export type Command = {
  id: CommandId;
  /** Chord like "mod+b", "mod+,", "escape" */
  shortcut?: string;
  /** Extra chords that run the same command */
  aliases?: string[];
  /** When true, runs even while focus is in an input/textarea/contenteditable */
  allowInInput?: boolean;
  run: () => void;
};

const store = () => useWorkspaceStore.getState();

function showPanel(view: LeftPanelView) {
  const s = store();
  if (s.leftPanelView === view && s.sidebarOpen) {
    s.toggleSidebar();
  } else {
    s.setLeftPanelView(view);
  }
}

function showGitTab(tab: GitPanelTab) {
  store().showGitPanel(tab);
}

export const workspaceCommands: Command[] = [
  {
    id: "toggleSidebar",
    shortcut: "mod+b",
    allowInInput: true,
    run: () => store().toggleSidebar(),
  },
  {
    id: "toggleTerminal",
    shortcut: "mod+j",
    allowInInput: true,
    run: () => store().toggleTerminal(),
  },
  {
    id: "showProblems",
    shortcut: "mod+shift+m",
    allowInInput: true,
    run: () => store().showProblemsPanel(),
  },
  {
    id: "showReferences",
    allowInInput: true,
    run: () => store().showReferencesPanel(),
  },
  {
    id: "showDebug",
    shortcut: "mod+shift+y",
    allowInInput: true,
    run: () => store().showDebugPanel(),
  },
  {
    id: "showConsole",
    shortcut: "mod+shift+u",
    allowInInput: true,
    run: () => store().showConsolePanel(),
  },
  ...(process.env.NODE_ENV === "development"
    ? ([
        {
          id: "showPerformance" as const,
          shortcut: "mod+shift+.",
          aliases: ["mod+shift+>"],
          allowInInput: true,
          run: () => store().showPerformancePanel(),
        },
      ] satisfies Command[])
    : []),
  {
    id: "toggleAiPanel",
    shortcut: "mod+l",
    allowInInput: true,
    run: () => store().toggleAiPanel(),
  },
  {
    id: "toggleNotifications",
    shortcut: "mod+shift+n",
    allowInInput: true,
    run: () => store().toggleNotificationsPanel(),
  },
  {
    id: "toggleChatPanel",
    shortcut: "mod+shift+c",
    allowInInput: true,
    run: () => store().toggleChatPanel(),
  },
  {
    id: "toggleCommentsPanel",
    shortcut: "mod+shift+u",
    allowInInput: true,
    run: () => store().toggleCommentsPanel(),
  },
  {
    id: "toggleDeployPanel",
    shortcut: "mod+alt+d",
    allowInInput: true,
    run: () => store().toggleDeployPanel(),
  },
  {
    id: "openSettings",
    shortcut: "mod+,",
    allowInInput: true,
    run: () => store().openSettings(),
  },
  {
    id: "openUserJson",
    shortcut: "mod+shift+j",
    allowInInput: true,
    run: () => store().requestOpenUserJson(),
  },
  {
    id: "toggleSettings",
    allowInInput: true,
    run: () => store().toggleSettings(),
  },
  {
    id: "closeSettings",
    shortcut: "escape",
    allowInInput: true,
    run: () => {
      const s = store();
      if (s.commandPaletteOpen) s.closeCommandPalette();
      else if (s.settingsOpen) s.closeSettings();
      else if (s.goToFileOpen) s.closeGoToFile();
      else if (s.goToSymbolOpen) s.closeGoToSymbol();
      else if (s.cloneFromGitHubOpen) s.closeCloneFromGitHub();
      else if (s.notificationsPanelOpen) s.closeNotificationsPanel();
      else if (s.chatPanelOpen) s.closeChatPanel();
      else if (s.commentsPanelOpen) s.closeCommentsPanel();
      else if (s.deployPanelOpen) s.closeDeployPanel();
      else if (s.zenMode) s.exitZenMode();
    },
  },
  {
    id: "openGoToFile",
    shortcut: "mod+p",
    allowInInput: true,
    run: () => store().openGoToFile(),
  },
  {
    id: "closeGoToFile",
    allowInInput: true,
    run: () => store().closeGoToFile(),
  },
  {
    id: "openGoToSymbol",
    shortcut: "mod+t",
    allowInInput: true,
    run: () => store().openGoToSymbol(),
  },
  {
    id: "closeGoToSymbol",
    allowInInput: true,
    run: () => store().closeGoToSymbol(),
  },
  {
    id: "openCommandPalette",
    shortcut: "mod+k",
    aliases: ["mod+shift+p"],
    allowInInput: true,
    run: () => store().openCommandPalette(),
  },
  {
    id: "closeCommandPalette",
    allowInInput: true,
    run: () => store().closeCommandPalette(),
  },
  {
    id: "openCloneFromGitHub",
    shortcut: "mod+i",
    allowInInput: true,
    run: () => store().openCloneFromGitHub(),
  },
  {
    id: "openNewProject",
    shortcut: "mod+n",
    allowInInput: true,
    run: () => store().requestOpenNewProject(),
  },
  {
    id: "showExplorer",
    shortcut: "mod+shift+e",
    aliases: ["mod+1"],
    allowInInput: true,
    run: () => {
      showPanel("explorer");
      // Focus the file tree so R/C/X and arrow navigation work immediately.
      queueMicrotask(() => {
        const tree = document.querySelector<HTMLElement>(
          '[aria-label="Project files"]',
        );
        tree?.focus();
      });
    },
  },
  {
    id: "showSearch",
    shortcut: "mod+shift+f",
    allowInInput: true,
    run: () => store().openFindInFiles(),
  },
  {
    id: "showGit",
    shortcut: "mod+9",
    allowInInput: true,
    run: () => showPanel("git"),
  },
  {
    id: "showCodeQuality",
    shortcut: "mod+shift+r",
    allowInInput: true,
    run: () => store().showCodeQualityPanel(),
  },
  {
    id: "showOutline",
    shortcut: "mod+shift+o",
    allowInInput: true,
    run: () => showPanel("outline"),
  },
  {
    id: "showDependencies",
    shortcut: "mod+shift+d",
    allowInInput: true,
    run: () => showPanel("dependencies"),
  },
  {
    id: "showEnv",
    shortcut: "mod+alt+e",
    allowInInput: true,
    run: () => showPanel("env"),
  },
  {
    id: "showExtensions",
    shortcut: "mod+shift+x",
    allowInInput: true,
    run: () => showPanel("extensions"),
  },
  {
    id: "showActivity",
    shortcut: "mod+shift+a",
    allowInInput: true,
    run: () => showPanel("activity"),
  },
  {
    id: "showGitChanges",
    shortcut: "mod+shift+g",
    allowInInput: true,
    run: () => showGitTab("changes"),
  },
  {
    id: "showGitHistory",
    shortcut: "mod+shift+h",
    allowInInput: true,
    run: () => showGitTab("history"),
  },
  {
    id: "findInFiles",
    shortcut: "mod+shift+f",
    allowInInput: true,
    run: () => store().openFindInFiles(),
  },
  {
    id: "formatDocument",
    allowInInput: true,
    run: () => {
      void import("@/features/workspace/lib/format-active-document").then(
        ({ formatActiveDocument }) => formatActiveDocument(),
      );
    },
  },
  {
    id: "saveFile",
    shortcut: "mod+s",
    allowInInput: true,
    run: () => {
      void import("@/features/workspace/lib/file-save-controller").then(
        ({ saveActiveFile }) => saveActiveFile(),
      );
    },
  },
  {
    id: "saveAllFiles",
    shortcut: "mod+shift+s",
    allowInInput: true,
    run: () => {
      void import("@/features/workspace/lib/file-save-controller").then(
        ({ saveAllFiles }) => saveAllFiles(),
      );
    },
  },
  {
    id: "inlineAiEdit",
    allowInInput: true,
    run: () => {
      if (!requestInlineAiEdit()) {
        store().openCommandPalette();
      }
    },
  },
  {
    id: "toggleLiveCollaboration",
    allowInInput: true,
    run: () => {
      if (!isLiveblocksConfigured()) {
        toast.message("Liveblocks is not configured", {
          description:
            "Add LIVEBLOCKS_SECRET_KEY and NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY.",
        });
        return;
      }
      const editorStore = useEditorSettingsStore.getState();
      const next = !editorStore.liveCollaboration;
      editorStore.setSettings({ liveCollaboration: next });
      toast.message(next ? "Live editing on" : "Live editing off", {
        description: next
          ? "Shared editing and named cursors are active."
          : "Editing without a Liveblocks room.",
      });
    },
  },
  {
    id: "toggleZenMode",
    shortcut: "mod+alt+z",
    allowInInput: true,
    run: () => {
      const s = store();
      const next = !s.zenMode;
      s.toggleZenMode();
      const chord = isApplePlatform() ? "⌥⌘Z" : "Ctrl+Alt+Z";
      toast.message(next ? "Zen mode on" : "Zen mode off", {
        description: next
          ? `Chrome hidden — press Esc or ${chord} to exit.`
          : "Workspace chrome restored.",
      });
    },
  },
  {
    id: "toggleBlame",
    shortcut: "mod+shift+alt+b",
    allowInInput: true,
    run: () => {
      const s = store();
      const next = !s.blameVisible;
      s.toggleBlame();
      toast.message(next ? "Git blame on" : "Git blame off", {
        description: next
          ? "Inline blame from GitHub — click an annotation to open the commit."
          : "Blame annotations hidden.",
      });
    },
  },
  {
    id: "findReferences",
    shortcut: "shift+f12",
    allowInInput: true,
    run: () => {
      void runFindReferences();
    },
  },
  {
    id: "renameSymbol",
    shortcut: "f2",
    allowInInput: true,
    run: () => {
      void runRenameSymbol();
    },
  },
];

const commandsById = Object.fromEntries(
  workspaceCommands.map((c) => [c.id, c]),
) as Record<CommandId, Command>;

export function runCommand(id: CommandId) {
  commandsById[id]?.run();
}

function normalizeEventChord(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");

  const key = event.key.toLowerCase();
  if (key === "control" || key === "meta" || key === "alt" || key === "shift") {
    return parts.join("+");
  }
  parts.push(key === "," ? "," : key);
  return parts.join("+");
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function matchShortcut(event: KeyboardEvent): Command | undefined {
  const chord = normalizeEventChord(event);
  return workspaceCommands.find(
    (c) => c.shortcut === chord || c.aliases?.includes(chord),
  );
}

export function handleWorkspaceKeydown(event: KeyboardEvent): boolean {
  const command = matchShortcut(event);
  if (!command) return false;

  if (isEditableTarget(event.target) && !command.allowInInput) {
    return false;
  }

  // On Apple: ⌘N opens New Project, leave ⌃N for AI "new chat".
  // On Windows/Linux: Ctrl+N is the mod key for New Project.
  if (command.id === "openNewProject") {
    if (isApplePlatform() && !event.metaKey) {
      return false;
    }
  }

  // ⌘K in the editor → inline AI edit; ⌘⇧P (or ⌘K outside editor) → palette.
  if (command.id === "openCommandPalette") {
    const chord = normalizeEventChord(event);
    const forcePalette = chord === "mod+shift+p";
    if (!forcePalette && isMonacoEditorTarget(event.target)) {
      event.preventDefault();
      if (!requestInlineAiEdit()) {
        store().openCommandPalette();
      }
      return true;
    }
  }

  if (command.id === "closeSettings") {
    const s = store();
    const closedInline = closeInlineAiEdit();
    if (closedInline) {
      event.preventDefault();
      return true;
    }
    if (s.goToFileOpen && isFileNavigatorEditing()) {
      return false;
    }
    if (
      !s.commandPaletteOpen &&
      !s.settingsOpen &&
      !s.goToFileOpen &&
      !s.goToSymbolOpen &&
      !s.cloneFromGitHubOpen &&
      !s.notificationsPanelOpen &&
      !s.chatPanelOpen &&
      !s.commentsPanelOpen &&
      !s.deployPanelOpen &&
      !s.zenMode
    ) {
      return false;
    }
  }

  event.preventDefault();
  command.run();
  return true;
}
