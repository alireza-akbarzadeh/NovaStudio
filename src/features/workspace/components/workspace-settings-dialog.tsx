"use client";

import {
  FocusIcon,
  FileJsonIcon,
  FolderPlusIcon,
  FolderTreeIcon,
  GaugeIcon,
  GitBranchIcon,
  KeyboardIcon,
  PanelBottomIcon,
  PanelLeftIcon,
  PanelRightIcon,
  SearchIcon,
  Settings2Icon,
  SettingsIcon,
  SparklesIcon,
  TypeIcon,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import { CustomizeIcon } from "@/features/customize/components/customize-icon";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { runCommand } from "@/features/workspace/commands/registry";
import { PrettierIcon } from "@/features/workspace/components/prettier-icon";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { IS_DEV } from "@/features/workspace/lib/is-dev";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { formatModShortcut } from "@/lib/keyboard";

export function WorkspaceSettingsDialog() {
  const params = useParams<{ projectId?: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const { openTab } = useEditorTabs(projectId ?? "");
  const settingsOpen = useWorkspaceStore((s) => s.settingsOpen);
  const closeSettings = useWorkspaceStore((s) => s.closeSettings);
  const openCloneFromGitHub = useWorkspaceStore((s) => s.openCloneFromGitHub);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);
  const terminalOpen = useWorkspaceStore((s) => s.terminalOpen);
  const aiPanelOpen = useWorkspaceStore((s) => s.aiPanelOpen);
  const zenMode = useWorkspaceStore((s) => s.zenMode);
  const panelSizes = useWorkspaceStore((s) => s.panelSizes);

  const onOpenChange = (open: boolean) => {
    if (!open) closeSettings();
  };

  const openEditorPage = (
    kind: "settings" | "shortcuts" | "user-json" | "customize" | "new-project",
  ) => {
    closeSettings();
    if (!projectId) return;
    openTab({ kind });
  };

  return (
    <CommandDialog
      open={settingsOpen}
      onOpenChange={onOpenChange}
      title="Settings"
      description="Search workspace settings and actions"
      showCloseButton={false}
      className="top-[18%] translate-y-0 sm:max-w-lg"
    >
      <CommandInput placeholder="Search settings…" />
      <CommandList className="max-h-[min(56vh,420px)]">
        <CommandEmpty>No settings found.</CommandEmpty>

        <CommandGroup heading="Preferences">
          <CommandItem
            value="advanced editor settings preferences shortcuts formatter prettier format"
            onSelect={() => openEditorPage("settings")}
          >
            <Settings2Icon />
            <span>Advanced Settings</span>
          </CommandItem>
          <CommandItem
            value="user json user settings settings.json monaco config vscode preferences editor json setting"
            onSelect={() => openEditorPage("user-json")}
          >
            <FileJsonIcon />
            <span>User JSON</span>
            <CommandShortcut>⌘⇧J</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="keyboard shortcuts keymap format document formatter prettier"
            onSelect={() => openEditorPage("shortcuts")}
          >
            <KeyboardIcon />
            <span>Keyboard Shortcuts</span>
          </CommandItem>
          <CommandItem
            value="customize plugins marketplace mcps skills rules extensions"
            onSelect={() => openEditorPage("customize")}
          >
            <CustomizeIcon className="size-4" strokeWidth={1.75} />
            <span>Customize</span>
          </CommandItem>
          <CommandItem
            value="mcp server connect custom model context protocol remote sse http"
            onSelect={() => {
              closeSettings();
              if (!projectId) return;
              router.push(`/projects/${projectId}/customize?category=mcps`);
            }}
          >
            <CustomizeIcon className="size-4" strokeWidth={1.75} />
            <span>Custom MCP Servers</span>
          </CommandItem>
          <CommandItem
            value="subagents hooks commands rules customize ai persona pre post response"
            onSelect={() => {
              closeSettings();
              if (!projectId) return;
              router.push(`/projects/${projectId}/customize?category=subagents`);
            }}
          >
            <CustomizeIcon className="size-4" strokeWidth={1.75} />
            <span>Subagents &amp; Hooks</span>
          </CommandItem>
          <CommandItem
            value="format document formatter prettier code style beautify"
            onSelect={() => {
              runCommand("formatDocument");
              closeSettings();
            }}
          >
            <PrettierIcon className="size-4" />
            <span>Format Document</span>
            <CommandShortcut>⇧⌥F</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="new project create workspace"
            onSelect={() => openEditorPage("new-project")}
          >
            <FolderPlusIcon />
            <span>New Project</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {IS_DEV ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Developer">
              <CommandItem
                value="performance memory heap monitor stats ram chart dev observability workspace metrics"
                onSelect={() => {
                  runCommand("showPerformance");
                  closeSettings();
                }}
              >
                <GaugeIcon />
                <span>Performance Monitor</span>
                <CommandShortcut>{formatModShortcut("mod+shift+.")}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}

        <CommandSeparator />

        <CommandGroup heading="GitHub">
          <CommandItem
            value="clone from github import repository"
            onSelect={() => {
              closeSettings();
              openCloneFromGitHub();
            }}
          >
            <Image
              src="/images/github.png"
              alt=""
              width={16}
              height={16}
              className="size-4 dark:invert"
            />
            <span>Clone from GitHub</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="show git panel source control"
            onSelect={() => {
              runCommand("showGit");
              closeSettings();
            }}
          >
            <GitBranchIcon />
            <span>Show Git</span>
            <CommandShortcut>⌘9</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Layout">
          <CommandItem
            value="toggle project sidebar"
            onSelect={() => {
              runCommand("toggleSidebar");
              closeSettings();
            }}
          >
            <PanelLeftIcon />
            <span>{sidebarOpen ? "Hide Project" : "Show Project"}</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="toggle terminal"
            onSelect={() => {
              runCommand("toggleTerminal");
              closeSettings();
            }}
          >
            <PanelBottomIcon />
            <span>{terminalOpen ? "Hide Terminal" : "Show Terminal"}</span>
            <CommandShortcut>⌘J</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="toggle ai panel chat"
            onSelect={() => {
              runCommand("toggleAiPanel");
              closeSettings();
            }}
          >
            <PanelRightIcon />
            <span>{aiPanelOpen ? "Hide AI" : "Show AI"}</span>
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="toggle zen focus mode distraction free"
            onSelect={() => {
              runCommand("toggleZenMode");
              closeSettings();
            }}
          >
            <FocusIcon />
            <span>{zenMode ? "Exit Zen Mode" : "Enter Zen Mode"}</span>
            <CommandShortcut>⌥⌘Z</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem
            value="search everywhere command palette files commands symbols"
            onSelect={() => {
              runCommand("openCommandPalette");
              closeSettings();
            }}
          >
            <SearchIcon />
            <span>Search Everywhere</span>
            <CommandShortcut>{formatModShortcut("mod+shift+f")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="go to file navigate project files double shift"
            onSelect={() => {
              runCommand("openGoToFile");
              closeSettings();
            }}
          >
            <FolderTreeIcon />
            <span>Go to File</span>
            <CommandShortcut>{formatModShortcut("mod+p")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="go to symbol workspace function class type interface"
            onSelect={() => {
              runCommand("openGoToSymbol");
              closeSettings();
            }}
          >
            <TypeIcon />
            <span>Go to Symbol in Workspace</span>
            <CommandShortcut>{formatModShortcut("mod+t")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="semantic codebase search natural language ai where how understand code"
            onSelect={() => {
              runCommand("openSemanticSearch");
              closeSettings();
            }}
          >
            <SparklesIcon />
            <span>Semantic Codebase Search</span>
            <CommandShortcut>{formatModShortcut("mod+alt+s")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="find in files search text sidebar panel"
            onSelect={() => {
              runCommand("showSearch");
              closeSettings();
            }}
          >
            <SearchIcon />
            <span>Find in Files</span>
            <CommandShortcut>{formatModShortcut("mod+alt+f")}</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="show project explorer"
            onSelect={() => {
              runCommand("showExplorer");
              closeSettings();
            }}
          >
            <FolderTreeIcon />
            <span>Show Project</span>
            <CommandShortcut>{formatModShortcut("mod+shift+e")}</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Status">
          <CommandItem value="sidebar width status" disabled>
            <SettingsIcon />
            <span>Sidebar width</span>
            <CommandShortcut>{Math.round(panelSizes.sidebar)}%</CommandShortcut>
          </CommandItem>
          <CommandItem value="terminal height status" disabled>
            <SettingsIcon />
            <span>Terminal height</span>
            <CommandShortcut>
              {Math.round(panelSizes.terminal)}%
            </CommandShortcut>
          </CommandItem>
          <CommandItem value="ai panel width status" disabled>
            <SettingsIcon />
            <span>AI width</span>
            <CommandShortcut>{Math.round(panelSizes.ai)}%</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
