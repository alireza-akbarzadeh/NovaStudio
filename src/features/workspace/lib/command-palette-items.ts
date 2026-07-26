/** Human-facing labels + search keywords for the command palette. */

import type { CommandId } from "@/features/workspace/commands/registry";
import { formatModShortcut } from "@/lib/keyboard";

export type PaletteCommandMeta = {
  id: CommandId;
  label: string;
  keywords?: string;
  /**
   * Platform-neutral chord using `mod` (⌘ on Apple, Ctrl on Windows/Linux),
   * e.g. `mod+k`, `mod+shift+f`.
   */
  shortcut?: string;
  /** Hide from the palette (internal / duplicate). */
  hidden?: boolean;
};

export const PALETTE_COMMANDS: PaletteCommandMeta[] = [
  {
    id: "openGoToFile",
    label: "Go to File",
    keywords: "open file quick open search files",
    shortcut: "mod+p",
  },
  {
    id: "findInFiles",
    label: "Find in Files",
    keywords: "search text workspace",
    shortcut: "mod+shift+f",
  },
  {
    id: "formatDocument",
    label: "Format Document",
    keywords: "prettier beautify format code",
  },
  {
    id: "inlineAiEdit",
    label: "Inline AI Edit",
    keywords: "quick edit rewrite selection ai ask edit",
    shortcut: "mod+k",
  },
  {
    id: "showExplorer",
    label: "Toggle Explorer",
    keywords: "files tree sidebar",
    shortcut: "mod+shift+e",
  },
  {
    id: "showSearch",
    label: "Show Search",
    keywords: "find search panel",
    shortcut: "mod+shift+f",
    hidden: true,
  },
  {
    id: "showGit",
    label: "Show Git",
    keywords: "source control changes",
    shortcut: "mod+9",
  },
  {
    id: "showCodeQuality",
    label: "Show Code Quality",
    keywords: "ai review suggestions patches quality explorer",
    shortcut: "mod+shift+r",
  },
  {
    id: "showOutline",
    label: "Show Outline",
    keywords: "symbols functions classes components outline",
    shortcut: "mod+shift+o",
  },
  {
    id: "showDependencies",
    label: "Show Dependencies",
    keywords: "npm packages install add remove deps node_modules",
    shortcut: "mod+shift+d",
  },
  {
    id: "showExtensions",
    label: "Show Extensions",
    keywords: "marketplace themes languages vue plugins install",
    shortcut: "mod+shift+x",
  },
  {
    id: "showGitChanges",
    label: "Git: Changes",
    keywords: "stage commit diff",
    shortcut: "mod+shift+g",
  },
  {
    id: "showGitHistory",
    label: "Git: History",
    keywords: "commits log",
    shortcut: "mod+shift+h",
  },
  {
    id: "toggleTerminal",
    label: "Toggle Terminal",
    keywords: "shell console bottom",
    shortcut: "mod+j",
  },
  {
    id: "showProblems",
    label: "Toggle Problems",
    keywords: "errors warnings diagnostics",
    shortcut: "mod+shift+m",
  },
  {
    id: "toggleAiPanel",
    label: "Toggle AI Panel",
    keywords: "chat assistant",
    shortcut: "mod+l",
  },
  {
    id: "toggleNotifications",
    label: "Toggle Notifications",
    keywords: "inbox alerts bell events",
    shortcut: "mod+shift+n",
  },
  {
    id: "toggleSidebar",
    label: "Toggle Sidebar",
    keywords: "explorer panel left",
    shortcut: "mod+b",
  },
  {
    id: "openSettings",
    label: "Open Settings",
    keywords: "preferences config",
    shortcut: "mod+,",
  },
  {
    id: "openUserJson",
    label: "Open User JSON",
    keywords: "settings.json monaco",
    shortcut: "mod+shift+j",
  },
  {
    id: "openCloneFromGitHub",
    label: "Clone from GitHub",
    keywords: "import repository",
    shortcut: "mod+i",
  },
  {
    id: "openNewProject",
    label: "New Project",
    keywords: "create",
    shortcut: "mod+n",
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

export function visiblePaletteCommands(
  isApple?: boolean,
): PaletteCommandMeta[] {
  return PALETTE_COMMANDS.filter((command) => !command.hidden).map(
    (command) => ({
      ...command,
      shortcut: command.shortcut
        ? formatModShortcut(command.shortcut, isApple)
        : undefined,
    }),
  );
}
