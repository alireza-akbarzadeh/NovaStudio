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

/** Chords use `mod` (⌘ on Apple, Ctrl on Windows/Linux). */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    shortcuts: [
      { id: "settings", label: "Open command settings", keys: "mod+," },
      { id: "user-json", label: "Open User JSON", keys: "mod+shift+j" },
      { id: "sidebar", label: "Toggle project sidebar", keys: "mod+b" },
      { id: "terminal", label: "Toggle terminal", keys: "mod+j" },
      { id: "problems", label: "Toggle problems", keys: "mod+shift+m" },
      { id: "debug", label: "Toggle debug", keys: "mod+shift+y", description: "Breakpoints + Run Node scripts" },
      {
        id: "performance",
        label: "Toggle performance monitor",
        keys: "mod+shift+.",
        description: "Memory charts & project stats (development only)",
      },
      { id: "ai", label: "Toggle AI panel", keys: "mod+l" },
      { id: "zen", label: "Toggle zen mode", keys: "mod+alt+z", description: "Hide chrome for a full-size editor" },
      { id: "notifications", label: "Toggle notifications", keys: "mod+shift+n" },
      {
        id: "goto",
        label: "Navigate project files",
        keys: "mod+p",
        description: "Also ⇧⇧ — search, create, rename without sidebar",
      },
      {
        id: "command-palette",
        label: "Search everywhere",
        keys: "mod+shift+f",
        description: "Also Ctrl/Cmd+Shift+P · Ctrl/Cmd+K outside the editor",
      },
      { id: "clone", label: "Clone from GitHub", keys: "mod+i" },
      { id: "explorer", label: "Toggle explorer", keys: "mod+shift+e", description: "Also mod+1" },
      { id: "search", label: "Find in files (sidebar panel)", keys: "mod+alt+f" },
      { id: "git", label: "Show Git panel", keys: "mod+9" },
      { id: "outline", label: "Show outline", keys: "mod+shift+o" },
      { id: "dependencies", label: "Show dependencies", keys: "mod+shift+d" },
      { id: "git-changes", label: "Git changes", keys: "mod+shift+g" },
      { id: "git-history", label: "Git history", keys: "mod+shift+h" },
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
        keys: "mod+k",
        description: "On the projects dashboard",
      },
      { id: "new", label: "New project", keys: "mod+n", description: "Opens as an editor tab" },
    ],
  },
  {
    id: "editor",
    title: "Editor",
    shortcuts: [
      {
        id: "save",
        label: "Save file",
        keys: "⌘ S",
        description: "Formats (if enabled) then writes to Convex immediately",
      },
      {
        id: "save-all",
        label: "Save all files",
        keys: "⌘ ⇧ S",
        description: "Flush every open / unsaved editor buffer",
      },
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
        id: "peek-definition",
        label: "Peek definition",
        keys: "⌥ F12",
        description: "Inline preview at the symbol definition",
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
