export type ShortcutEntry = {
  id: string;
  label: string;
  keys: string;
  description?: string;
};

export type ShortcutGroup = {
  id: string;
  title: string;
  shortcuts: ShortcutEntry[];
};

/** Display chords use ⌘ for Mod (macOS-first, matching the rest of the workspace UI). */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    shortcuts: [
      { id: "settings", label: "Open command settings", keys: "⌘ ," },
      { id: "user-json", label: "Open User JSON", keys: "⌘ ⇧ J" },
      { id: "sidebar", label: "Toggle project sidebar", keys: "⌘ B" },
      { id: "terminal", label: "Toggle terminal", keys: "⌘ J" },
      { id: "problems", label: "Toggle problems", keys: "⌘ ⇧ M" },
      { id: "ai", label: "Toggle AI panel", keys: "⌘ L" },
      { id: "notifications", label: "Toggle notifications", keys: "⌘ ⇧ N" },
      { id: "goto", label: "Go to file", keys: "⌘ P" },
      { id: "command-palette", label: "Command palette", keys: "⌘ ⇧ P", description: "Also ⌘ K outside the editor" },
      { id: "clone", label: "Clone from GitHub", keys: "⌘ I" },
      { id: "explorer", label: "Toggle explorer", keys: "⌘ ⇧ E", description: "Also ⌘ 1" },
      { id: "search", label: "Find in files", keys: "⌘ ⇧ F" },
      { id: "git", label: "Show Git panel", keys: "⌘ 9" },
      { id: "outline", label: "Show outline", keys: "⌘ ⇧ O" },
      { id: "dependencies", label: "Show dependencies", keys: "⌘ ⇧ D" },
      { id: "git-changes", label: "Git changes", keys: "⌘ ⇧ G" },
      { id: "git-history", label: "Git history", keys: "⌘ ⇧ H" },
      { id: "escape", label: "Close dialogs", keys: "Esc" },
    ],
  },
  {
    id: "projects",
    title: "Projects",
    shortcuts: [
      {
        id: "command",
        label: "Open projects picker",
        keys: "⌘ K",
        description: "On the projects dashboard",
      },
      { id: "new", label: "New project", keys: "⌘ N", description: "Opens as an editor tab" },
    ],
  },
  {
    id: "editor",
    title: "Editor",
    shortcuts: [
      { id: "find", label: "Find", keys: "⌘ F" },
      { id: "replace", label: "Replace", keys: "⌘ H" },
      { id: "undo", label: "Undo", keys: "⌘ Z" },
      { id: "redo", label: "Redo", keys: "⌘ ⇧ Z" },
      { id: "select-all", label: "Select all", keys: "⌘ A" },
      { id: "indent", label: "Indent", keys: "Tab" },
      { id: "outdent", label: "Outdent", keys: "⇧ Tab" },
      { id: "fold", label: "Fold code", keys: "⌘ ⌥ [" },
      { id: "unfold", label: "Unfold code", keys: "⌘ ⌥ ]" },
      { id: "comment", label: "Toggle comment", keys: "⌘ /" },
      {
        id: "format",
        label: "Format document",
        keys: "⇧ ⌥ F",
        description: "Prettier formatter (also ⌘ ⇧ I)",
      },
      {
        id: "go-to-definition",
        label: "Go to definition",
        keys: "F12",
        description: "Also ⌘-click a component or import",
      },
      {
        id: "inline-ai-edit",
        label: "Inline AI edit",
        keys: "⌘ K",
        description: "Selection → rewrite → Accept / Reject",
      },
      {
        id: "ai-accept",
        label: "Accept AI suggestion",
        keys: "Tab",
        description: "When ghost text is visible",
      },
    ],
  },
  {
    id: "file-tree",
    title: "File tree",
    shortcuts: [
      {
        id: "new-file",
        label: "New file",
        keys: "A",
        description:
          "Type a path with / to nest folders, e.g. components/button/type/button.ts",
      },
      { id: "rename", label: "Rename", keys: "R", description: "Also F2" },
      { id: "copy", label: "Copy", keys: "C", description: "Also ⌘ C" },
      { id: "cut", label: "Cut", keys: "X", description: "Also ⌘ X" },
      {
        id: "paste",
        label: "Paste / move",
        keys: "V",
        description: "After X, navigate with ↑↓ then V to move",
      },
      { id: "delete", label: "Delete", keys: "Delete" },
      { id: "nav", label: "Navigate", keys: "↑ ↓ ← →" },
    ],
  },
  {
    id: "terminal",
    title: "Terminal",
    shortcuts: [
      { id: "complete", label: "Autocomplete", keys: "Tab" },
      { id: "history-up", label: "Previous command", keys: "↑" },
      { id: "history-down", label: "Next command", keys: "↓" },
      { id: "clear", label: "Clear screen", keys: "⌃ L" },
      { id: "kill-line", label: "Clear line", keys: "⌃ U" },
      { id: "kill-word", label: "Delete word", keys: "⌃ W" },
    ],
  },
  {
    id: "ai-chat",
    title: "AI chat",
    shortcuts: [
      { id: "new-chat", label: "New chat", keys: "⌃ N" },
    ],
  },
];
