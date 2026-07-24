"use client";

import { FileIcon } from "@react-symbols/icons/utils";
import {
  ClockIcon,
  CornerDownLeftIcon,
  FileIcon as FileLucideIcon,
  TerminalIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import {
  runCommand,
  type CommandId,
} from "@/features/workspace/commands/registry";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useProjectFiles } from "@/features/workspace/hooks/use-project-files";
import { visiblePaletteCommands } from "@/features/workspace/lib/command-palette-items";
import {
  loadRecentFilePaths,
  pushRecentFilePath,
} from "@/features/workspace/lib/recent-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceCommandPaletteProps = {
  projectId: string;
};

function fileName(path: string) {
  return path.split("/").filter(Boolean).pop() || path;
}

function parentDir(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

export function WorkspaceCommandPalette({
  projectId,
}: WorkspaceCommandPaletteProps) {
  const open = useWorkspaceStore((s) => s.commandPaletteOpen);
  const closeCommandPalette = useWorkspaceStore((s) => s.closeCommandPalette);
  const editorTabs = useWorkspaceStore((s) => s.editorTabs);
  const files = useProjectFiles(projectId);
  const { openTab } = useEditorTabs(projectId);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setRecentPaths(loadRecentFilePaths(projectId));
  }, [open, projectId]);

  // Keep recent list warm when tabs change (even if palette is closed).
  useEffect(() => {
    for (const tab of editorTabs) {
      if (tab.kind === "file" && tab.path) {
        pushRecentFilePath(projectId, tab.path);
      }
    }
  }, [editorTabs, projectId]);

  const filePaths = useMemo(
    () =>
      (files ?? [])
        .filter((file) => file.kind === "file")
        .map((file) => file.path)
        .sort((a, b) => a.localeCompare(b)),
    [files],
  );

  const fileSet = useMemo(() => new Set(filePaths), [filePaths]);

  const recent = useMemo(
    () => recentPaths.filter((path) => fileSet.has(path)).slice(0, 8),
    [recentPaths, fileSet],
  );

  const openFilePaths = useMemo(
    () =>
      editorTabs
        .filter(
          (tab): tab is typeof tab & { kind: "file"; path: string } =>
            tab.kind === "file" && Boolean(tab.path),
        )
        .map((tab) => tab.path),
    [editorTabs],
  );

  const commands = useMemo(() => visiblePaletteCommands(), []);

  const onOpenChange = (next: boolean) => {
    if (!next) closeCommandPalette();
  };

  const openFile = (path: string) => {
    pushRecentFilePath(projectId, path);
    openTab({ kind: "file", path });
    closeCommandPalette();
  };

  const runPaletteCommand = (id: CommandId) => {
    closeCommandPalette();
    // Defer so the dialog unmounts before the command opens another overlay.
    queueMicrotask(() => runCommand(id));
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command Palette"
      description="Search files and run workspace commands"
      showCloseButton={false}
      className="top-[16%] translate-y-0 border-ws-border bg-ws-panel sm:max-w-xl [&_[cmdk-group-heading]]:text-ws-text-muted [&_[cmdk-input]]:text-ws-text"
    >
      <CommandInput
        placeholder="Type a command or file name…"
        className="text-[13px]"
      />
      <CommandList className="max-h-[min(60vh,460px)]">
        <CommandEmpty className="py-6 text-[12px] text-ws-text-muted">
          No matching files or commands.
        </CommandEmpty>

        {recent.length > 0 ? (
          <CommandGroup heading="Recent">
            {recent.map((path) => (
              <CommandItem
                key={`recent:${path}`}
                value={`recent ${fileName(path)} ${path}`}
                onSelect={() => openFile(path)}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <ClockIcon className="size-3.5 shrink-0 opacity-60" />
                <FileRow path={path} />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {openFilePaths.length > 0 ? (
          <CommandGroup heading="Open editors">
            {openFilePaths.map((path) => (
              <CommandItem
                key={`open:${path}`}
                value={`open editor ${fileName(path)} ${path}`}
                onSelect={() => openFile(path)}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <FileLucideIcon className="size-3.5 shrink-0 opacity-60" />
                <FileRow path={path} />
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        {(recent.length > 0 || openFilePaths.length > 0) && (
          <CommandSeparator className="bg-ws-border" />
        )}

        <CommandGroup heading="Commands">
          {commands.map((command) => (
            <CommandItem
              key={command.id}
              value={`command ${command.label} ${command.keywords ?? ""} ${command.id}`}
              onSelect={() => runPaletteCommand(command.id)}
              className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
            >
              <TerminalIcon className="size-3.5 shrink-0 opacity-60" />
              <span className="min-w-0 flex-1 truncate text-[12px]">
                {command.label}
              </span>
              {command.shortcut ? (
                <CommandShortcut className="text-[10px] text-ws-text-muted">
                  {command.shortcut}
                </CommandShortcut>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-ws-border" />

        <CommandGroup heading="Files">
          {filePaths.map((path) => (
            <CommandItem
              key={`file:${path}`}
              value={`file ${fileName(path)} ${path} ${path.replace(/\//g, " ")}`}
              onSelect={() => openFile(path)}
              className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
            >
              <span className="size-3.5 shrink-0 [&_svg]:size-full">
                <FileIcon fileName={fileName(path)} autoAssign />
              </span>
              <FileRow path={path} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center gap-3 border-t border-ws-border-subtle px-3 py-1.5 text-[10px] text-ws-text-muted">
        <span className="inline-flex items-center gap-1">
          <CornerDownLeftIcon className="size-3" />
          Open
        </span>
        <span>↑↓ Navigate</span>
        <span className="ml-auto">Esc Close</span>
      </div>
    </CommandDialog>
  );
}

function FileRow({ path }: { path: string }) {
  const dir = parentDir(path);
  return (
    <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
      <span className="shrink-0 text-[12px] font-medium text-ws-text">
        {fileName(path)}
      </span>
      {dir ? (
        <span className={cn("min-w-0 truncate text-[10px] text-ws-text-muted")}>
          {dir}
        </span>
      ) : null}
    </span>
  );
}
