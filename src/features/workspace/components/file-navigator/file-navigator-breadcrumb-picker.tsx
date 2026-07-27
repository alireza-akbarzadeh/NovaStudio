"use client";

import { ChevronDownIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import { useProjectFileMetadata } from "@/features/workspace/hooks/use-project-files";
import type { BreadcrumbSegment } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

import {
  FileNavigatorItemIcon,
  FileNavigatorRow,
} from "./file-navigator-row";
import {
  joinNavigatorPath,
  listFolderContents,
} from "./file-navigator-utils";

type FileNavigatorBreadcrumbPickerProps = {
  projectId: string;
  segment: BreadcrumbSegment;
  segmentIndex: number;
  allSegments: BreadcrumbSegment[];
  isLast: boolean;
};

export function FileNavigatorBreadcrumbPicker({
  projectId,
  segment,
  segmentIndex,
  allSegments,
  isLast,
}: FileNavigatorBreadcrumbPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [drillPath, setDrillPath] = useState("");
  const metadata = useProjectFileMetadata(projectId);
  const { openTab } = useEditorTabs(projectId);

  const anchorFolderPath = useMemo(
    () =>
      joinNavigatorPath(
        allSegments.slice(0, segmentIndex + 1).map((entry) => entry.label),
      ),
    [allSegments, segmentIndex],
  );

  useEffect(() => {
    if (open) {
      setDrillPath(anchorFolderPath);
      setQuery("");
    }
  }, [anchorFolderPath, open]);

  const contents = useMemo(() => {
    const listed = listFolderContents(metadata, drillPath);
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return listed;

    return {
      folders: listed.folders.filter((folder) =>
        folder.name.toLowerCase().includes(trimmed),
      ),
      fileEntries: listed.fileEntries.filter((file) =>
        file.name.toLowerCase().includes(trimmed),
      ),
    };
  }, [drillPath, metadata, query]);

  const openFile = (path: string) => {
    openTab({ kind: "file", path }, { mode: "preview" });
    setOpen(false);
  };

  const enterFolder = (path: string) => {
    setDrillPath(path);
    setQuery("");
  };

  if (isLast) {
    return (
      <span className="flex max-w-45 items-center gap-1 truncate font-medium text-ws-text">
        <FileNavigatorItemIcon kind="file" path={segment.label} />
        <span className="truncate">{segment.label}</span>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-30 items-center gap-0.5 truncate rounded-sm px-1 py-0.5 text-ws-text-muted transition-colors",
            "hover:bg-ws-hover hover:text-ws-text data-[state=open]:bg-ws-hover data-[state=open]:text-ws-text",
          )}
        >
          <span className="truncate">{segment.label}</span>
          <ChevronDownIcon className="size-3 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 border-ws-border bg-ws-panel p-0"
        sideOffset={6}
      >
        <Command shouldFilter={false} className="bg-ws-panel">
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={`Browse ${segment.label}…`}
            className="text-[12px]"
          />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-[11px] text-ws-text-muted">
              Nothing here
            </CommandEmpty>
            {drillPath !== anchorFolderPath ? (
              <CommandGroup heading="Navigate">
                <CommandItem
                  value="navigate-up"
                  onSelect={() => enterFolder(anchorFolderPath)}
                  className="gap-2 py-1.5 text-ws-text-secondary data-[selected=true]:bg-ws-hover"
                >
                  <span className="text-[12px]">..</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            {contents.folders.length > 0 ? (
              <CommandGroup heading="Folders">
                {contents.folders.map((folder) => (
                  <CommandItem
                    key={folder.path}
                    value={folder.path}
                    onSelect={() => enterFolder(folder.path)}
                    className="gap-2 py-1.5 text-ws-text-secondary data-[selected=true]:bg-ws-hover"
                  >
                    <FileNavigatorItemIcon kind="folder" path={folder.path} />
                    <span className="truncate text-[12px]">{folder.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {contents.fileEntries.length > 0 ? (
              <CommandGroup heading="Files">
                {contents.fileEntries.map((file) => (
                  <CommandItem
                    key={file.path}
                    value={file.path}
                    onSelect={() => openFile(file.path)}
                    className="gap-2 py-1.5 text-ws-text-secondary data-[selected=true]:bg-ws-hover"
                  >
                    <FileNavigatorItemIcon kind="file" path={file.path} />
                    <FileNavigatorRow path={file.path} query={query} />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
