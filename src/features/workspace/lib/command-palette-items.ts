/** Human-facing labels + search keywords for the command palette. */

import type { CommandId } from "@/features/workspace/commands/registry";

export type PaletteCommandMeta = {
  id: CommandId;
  label: string;
  keywords?: string;
  shortcut?: string;
  /** Hide from the palette (internal / duplicate). */
  hidden?: boolean;
};

export const PALETTE_COMMANDS: PaletteCommandMeta[] = [
  {
    id: "openGoToFile",
    label: "Go to File",
    keywords: "open file quick open search files",
    shortcut: "⌘P",
  },
  {
    id: "findInFiles",
    label: "Find in Files",
    keywords: "search text workspace",
    shortcut: "⌘⇧F",
  },
  {
    id: "formatDocument",
    label: "Format Document",
    keywords: "prettier beautify format code",
  },
  {
    id: "showExplorer",
    label: "Show Explorer",
    keywords: "files tree sidebar",
    shortcut: "⌘1",
  },
  {
    id: "showSearch",
    label: "Show Search",
    keywords: "find search panel",
    shortcut: "⌘⇧F",
    hidden: true,
  },
  {
    id: "showGit",
    label: "Show Git",
    keywords: "source control changes",
    shortcut: "⌘9",
  },
  {
    id: "showOutline",
    label: "Show Outline",
    keywords: "symbols functions classes components outline",
    shortcut: "⌘⇧O",
  },
  {
    id: "showDependencies",
    label: "Show Dependencies",
    keywords: "npm packages install add remove deps node_modules",
    shortcut: "⌘⇧D",
  },
  {
    id: "showGitChanges",
    label: "Git: Changes",
    keywords: "stage commit diff",
    shortcut: "⌘⇧G",
  },
  {
    id: "showGitHistory",
    label: "Git: History",
    keywords: "commits log",
    shortcut: "⌘⇧H",
  },
  {
    id: "toggleTerminal",
    label: "Toggle Terminal",
    keywords: "shell console bottom",
    shortcut: "⌘J",
  },
  {
    id: "showProblems",
    label: "Toggle Problems",
    keywords: "errors warnings diagnostics",
    shortcut: "⌘⇧M",
  },
  {
    id: "toggleAiPanel",
    label: "Toggle AI Panel",
    keywords: "chat assistant",
    shortcut: "⌘L",
  },
  {
    id: "toggleSidebar",
    label: "Toggle Sidebar",
    keywords: "explorer panel left",
    shortcut: "⌘B",
  },
  {
    id: "openSettings",
    label: "Open Settings",
    keywords: "preferences config",
    shortcut: "⌘,",
  },
  {
    id: "openUserJson",
    label: "Open User JSON",
    keywords: "settings.json monaco",
    shortcut: "⌘⇧J",
  },
  {
    id: "openCloneFromGitHub",
    label: "Clone from GitHub",
    keywords: "import repository",
    shortcut: "⌘I",
  },
  {
    id: "openNewProject",
    label: "New Project",
    keywords: "create",
    shortcut: "⌘N",
  },
  {
    id: "toggleSettings",
    label: "Toggle Settings",
    hidden: true,
  },
  {
    id: "closeSettings",
    label: "Close Dialogs",
    hidden: true,
  },
  {
    id: "closeGoToFile",
    label: "Close Go to File",
    hidden: true,
  },
];

export function visiblePaletteCommands(): PaletteCommandMeta[] {
  return PALETTE_COMMANDS.filter((command) => !command.hidden);
}
