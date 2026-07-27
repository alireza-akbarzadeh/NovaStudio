"use client";

import { FileIcon } from "@react-symbols/icons/utils";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ChevronRightIcon,
  ClockIcon,
  CornerDownLeftIcon,
  FilePenIcon,
  FilePlusIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  Loader2Icon,
  PencilIcon,
  ScissorsIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import {
  useCreateProjectFile,
  useMoveProjectFile,
  useProjectFileMetadata,
} from "@/features/workspace/hooks/use-project-files";
import { pushRecentFilePath } from "@/features/workspace/lib/recent-files";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { formatModShortcut } from "@/lib/keyboard";
import { useIsApplePlatform } from "@/lib/use-is-apple-platform";
import { cn } from "@/lib/utils";

import {
  FileNavigatorItemIcon,
  FileNavigatorRow,
} from "./file-navigator-row";
import {
  fileBaseName,
  fileParentDir,
  joinNavigatorPath,
  splitNavigatorPath,
} from "./file-navigator-utils";
import {
  parseNavigatorSelection,
  runNavigatorCreate,
  runNavigatorRename,
  useFileNavigatorActions,
} from "./use-file-navigator-actions";
import { setFileNavigatorEditing } from "./file-navigator-edit-guard";
import { useFileNavigatorSearch } from "./use-file-navigator-search";

type NavigatorEditMode =
  | { type: "create-file"; parentPath: string; initialName?: string }
  | { type: "create-folder"; parentPath: string; initialName?: string }
  | {
      type: "rename";
      path: string;
      kind: "file" | "folder";
      currentName: string;
    };

type ProjectFileNavigatorDialogProps = {
  projectId: string;
};

function folderLabel(path: string) {
  return path || "project root";
}

export function ProjectFileNavigatorDialog({
  projectId,
}: ProjectFileNavigatorDialogProps) {
  const open = useWorkspaceStore((s) => s.goToFileOpen);
  const closeGoToFile = useWorkspaceStore((s) => s.closeGoToFile);
  const editorTabs = useWorkspaceStore((s) => s.editorTabs);
  const treeClipboard = useWorkspaceStore((s) => s.treeClipboard);
  const clearTreeClipboard = useWorkspaceStore((s) => s.clearTreeClipboard);

  const metadata = useProjectFileMetadata(projectId);
  const { openTab } = useEditorTabs(projectId);
  const createFileMutation = useCreateProjectFile();
  const moveFile = useMoveProjectFile();
  const { canEdit, createItem, renameItem } = useFileNavigatorActions(projectId);
  const isApple = useIsApplePlatform();

  const [query, setQuery] = useState("");
  const [browsePath, setBrowsePath] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [editMode, setEditMode] = useState<NavigatorEditMode | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setBrowsePath("");
      setSelectedValue("");
      setEditMode(null);
      setEditName("");
    }
  }, [open]);

  useEffect(() => {
    setFileNavigatorEditing(Boolean(editMode));
    return () => setFileNavigatorEditing(false);
  }, [editMode]);

  useEffect(() => {
    if (!editMode) return;
    const id = window.requestAnimationFrame(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [editMode]);

  const search = useFileNavigatorSearch({
    projectId,
    metadata,
    query,
    browsePath,
    enabled: open && !editMode,
  });

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

  const browseSegments = useMemo(
    () => splitNavigatorPath(browsePath),
    [browsePath],
  );

  const canPasteInto =
    treeClipboard?.projectId === projectId &&
    treeClipboard.mode === "cut" &&
    Boolean(treeClipboard.path);

  const onOpenChange = (next: boolean) => {
    if (!next) closeGoToFile();
  };

  const close = useCallback(() => {
    closeGoToFile();
  }, [closeGoToFile]);

  const openFile = useCallback(
    (path: string, mode: "preview" | "permanent" = "preview") => {
      pushRecentFilePath(projectId, path);
      openTab({ kind: "file", path }, { mode });
      close();
    },
    [close, openTab, projectId],
  );

  const navigateFolder = useCallback((path: string) => {
    setQuery("");
    setBrowsePath(path);
  }, []);

  const navigateUp = useCallback(() => {
    const segments = splitNavigatorPath(browsePath);
    if (segments.length === 0) return;
    segments.pop();
    setBrowsePath(joinNavigatorPath(segments));
  }, [browsePath]);

  const startCreateFile = useCallback(
    (parentPath = browsePath) => {
      setEditMode({ type: "create-file", parentPath });
      setEditName("");
    },
    [browsePath],
  );

  const startCreateFolder = useCallback(
    (parentPath = browsePath) => {
      setEditMode({ type: "create-folder", parentPath });
      setEditName("");
    },
    [browsePath],
  );

  const startRename = useCallback(
    (path: string, kind: "file" | "folder") => {
      setEditMode({
        type: "rename",
        path,
        kind,
        currentName: fileBaseName(path),
      });
      setEditName(fileBaseName(path));
    },
    [],
  );

  const cancelEditMode = useCallback(() => {
    setEditMode(null);
    setEditName("");
  }, []);

  const createAtPath = useCallback(
    async (path: string) => {
      if (!path.trim() || busy) return;
      setBusy(true);
      try {
        const created = await createFileMutation({
          projectId: projectId as Id<"projects">,
          name: path,
          kind: "file",
          content: "",
        });
        pushRecentFilePath(projectId, created.path);
        openTab({ kind: "file", path: created.path }, { mode: "permanent" });
        close();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create file",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, close, createFileMutation, openTab, projectId],
  );

  const createFolderAtPath = useCallback(
    async (path: string) => {
      if (!path.trim() || busy) return;
      setBusy(true);
      try {
        await createFileMutation({
          projectId: projectId as Id<"projects">,
          name: path,
          kind: "folder",
        });
        setBrowsePath(path);
        setQuery("");
        toast.success(`Created folder ${fileBaseName(path)}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create folder",
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, createFileMutation, projectId],
  );

  const submitEditMode = useCallback(async () => {
    if (!editMode || busy) return;
    setBusy(true);
    try {
      if (editMode.type === "create-file") {
        const ok = await runNavigatorCreate(
          createItem,
          metadata,
          {
            name: editName,
            kind: "file",
            parentPath: editMode.parentPath,
          },
          (path) => {
            openTab({ kind: "file", path }, { mode: "permanent" });
            close();
          },
        );
        if (ok) cancelEditMode();
        return;
      }

      if (editMode.type === "create-folder") {
        const ok = await runNavigatorCreate(createItem, metadata, {
          name: editName,
          kind: "folder",
          parentPath: editMode.parentPath,
        });
        if (ok) {
          const createdPath = editMode.parentPath
            ? `${editMode.parentPath}/${editName.trim()}`
            : editName.trim();
          setBrowsePath(createdPath);
          cancelEditMode();
        }
        return;
      }

      const ok = await runNavigatorRename(renameItem, {
        path: editMode.path,
        newName: editName,
        kind: editMode.kind,
      });
      if (ok) cancelEditMode();
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    cancelEditMode,
    close,
    createItem,
    editMode,
    editName,
    metadata,
    openTab,
    renameItem,
  ]);

  const pasteIntoFolder = useCallback(
    async (folderPath: string) => {
      if (!canPasteInto || !treeClipboard || busy) return;
      setBusy(true);
      try {
        const folder = metadata?.find(
          (item) => item.kind === "folder" && item.path === folderPath,
        );
        await moveFile({
          projectId: projectId as Id<"projects">,
          path: treeClipboard.path,
          newParentId: folder?._id,
        });
        clearTreeClipboard();
        toast.success(`Moved to ${folderPath || "project root"}`);
        close();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to move item",
        );
      } finally {
        setBusy(false);
      }
    },
    [
      busy,
      canPasteInto,
      clearTreeClipboard,
      close,
      metadata,
      moveFile,
      projectId,
      treeClipboard,
    ],
  );

  const renameSelection = useCallback(() => {
    const selected = parseNavigatorSelection(selectedValue);
    if (!selected) return;
    startRename(selected.path, selected.kind);
  }, [selectedValue, startRename]);

  useEffect(() => {
    if (!open || editMode) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F2" && canEdit) {
        event.preventDefault();
        event.stopPropagation();
        renameSelection();
        return;
      }

      if (
        canEdit &&
        !search.isSearching &&
        event.key.toLowerCase() === "a" &&
        event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        event.stopPropagation();
        startCreateFile();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    canEdit,
    editMode,
    open,
    renameSelection,
    search.isSearching,
    startCreateFile,
  ]);

  const showRecent =
    !editMode && !search.isSearching && search.recentPaths.length > 0 && !browsePath;
  const showOpenEditors =
    !editMode && !search.isSearching && openFilePaths.length > 0 && !browsePath;
  const showBrowse =
    !editMode &&
    !search.isSearching &&
    (browsePath ||
      search.browseFolders.length > 0 ||
      search.browseFiles.length > 0);
  const showActions = canEdit && !editMode && !search.isSearching;
  const hasResults =
    showActions ||
    showRecent ||
    showOpenEditors ||
    search.fileMatches.length > 0 ||
    search.browseFolders.length > 0 ||
    search.browseFiles.length > 0 ||
    Boolean(search.createFilePath) ||
    Boolean(search.createFolderPath) ||
    (canPasteInto && !search.isSearching && !editMode);

  const modShortcut = formatModShortcut("mod+p", isApple);
  const shiftShortcut = "⇧ ⇧";

  const editModeTitle =
    editMode?.type === "create-file"
      ? `New file in ${folderLabel(editMode.parentPath)}`
      : editMode?.type === "create-folder"
        ? `New folder in ${folderLabel(editMode.parentPath)}`
        : editMode?.type === "rename"
          ? `Rename ${editMode.currentName}`
          : null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Navigate Project Files"
      description="Search, browse, create, rename, and open project files"
      showCloseButton={false}
      className="top-[14%] translate-y-0 border-ws-border bg-ws-panel sm:max-w-xl [&_[cmdk-group-heading]]:text-ws-text-muted [&_[cmdk-input]]:text-ws-text"
    >
      <Command
        shouldFilter={false}
        value={selectedValue}
        onValueChange={setSelectedValue}
        className="bg-ws-panel"
        onKeyDown={(event) => {
          if (editMode && event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            cancelEditMode();
          }
        }}
      >
        {editMode ? (
          <div className="border-b border-ws-border-subtle px-3 py-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-medium text-ws-text">
                {editModeTitle}
              </span>
              <button
                type="button"
                onClick={cancelEditMode}
                className="inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
                aria-label="Cancel"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
            <Input
              ref={editInputRef}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submitEditMode();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  cancelEditMode();
                }
              }}
              disabled={busy}
              placeholder={
                editMode.type === "create-folder"
                  ? "Folder name…"
                  : editMode.type === "rename"
                    ? "New name…"
                    : "File name…"
              }
              className="h-8 border-ws-border bg-ws-hover text-[12px] text-ws-text focus-visible:border-ws-accent focus-visible:ring-0"
            />
          </div>
        ) : (
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={
              browsePath
                ? `Search in ${browsePath}/… or type a name to create`
                : "Search, type a path to create, or browse folders…"
            }
            className="text-[13px]"
          />
        )}

        {!editMode && !search.isSearching && browsePath ? (
          <div className="flex items-center gap-1 border-b border-ws-border-subtle px-3 py-1.5 text-[11px] text-ws-text-muted">
            <button
              type="button"
              onClick={() => setBrowsePath("")}
              className="rounded-sm px-1 py-0.5 transition-colors hover:bg-ws-hover hover:text-ws-text"
            >
              Project
            </button>
            {browseSegments.map((segment, index) => {
              const segmentPath = joinNavigatorPath(
                browseSegments.slice(0, index + 1),
              );
              const isLast = index === browseSegments.length - 1;
              return (
                <span key={segmentPath} className="inline-flex items-center gap-1">
                  <ChevronRightIcon className="size-3 opacity-60" />
                  <button
                    type="button"
                    disabled={isLast}
                    onClick={() => setBrowsePath(segmentPath)}
                    className={cn(
                      "max-w-28 truncate rounded-sm px-1 py-0.5 transition-colors",
                      isLast
                        ? "font-medium text-ws-text"
                        : "hover:bg-ws-hover hover:text-ws-text",
                    )}
                  >
                    {segment}
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <CommandList className="max-h-[min(56vh,440px)]">
          {editMode ? (
            <CommandGroup heading="Confirm">
              <CommandItem
                value="confirm-edit"
                onSelect={() => void submitEditMode()}
                disabled={busy || !editName.trim()}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <CornerDownLeftIcon className="size-3.5 shrink-0" />
                <span className="text-[12px]">
                  {editMode.type === "rename" ? "Rename" : "Create"}
                </span>
              </CommandItem>
              <CommandItem
                value="cancel-edit"
                onSelect={cancelEditMode}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <XIcon className="size-3.5 shrink-0" />
                <span className="text-[12px]">Cancel</span>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {metadata === undefined ? (
            <div className="flex items-center gap-2 px-3 py-6 text-[12px] text-ws-text-muted">
              <Loader2Icon className="size-3.5 animate-spin" />
              Loading project files…
            </div>
          ) : null}

          {metadata !== undefined && !editMode && !hasResults ? (
            <CommandEmpty className="py-6 text-[12px] text-ws-text-muted">
              {search.isSearching
                ? "No matching files or folders."
                : "This folder is empty."}
            </CommandEmpty>
          ) : null}

          {showActions ? (
            <CommandGroup heading="Actions">
              <CommandItem
                value="action:new-file"
                onSelect={() => startCreateFile()}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <FilePlusIcon className="size-3.5 shrink-0 text-ws-accent-soft" />
                <span className="text-[12px]">
                  New file in {folderLabel(browsePath)}
                </span>
              </CommandItem>
              <CommandItem
                value="action:new-folder"
                onSelect={() => startCreateFolder()}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <FolderPlusIcon className="size-3.5 shrink-0 text-ws-accent-soft" />
                <span className="text-[12px]">
                  New folder in {folderLabel(browsePath)}
                </span>
              </CommandItem>
              {selectedValue ? (
                <CommandItem
                  value="action:rename-selected"
                  onSelect={renameSelection}
                  className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <PencilIcon className="size-3.5 shrink-0" />
                  <span className="text-[12px]">Rename selected (F2)</span>
                </CommandItem>
              ) : null}
            </CommandGroup>
          ) : null}

          {!editMode && search.createFilePath ? (
            <CommandGroup heading="Create">
              <CommandItem
                value={`create ${search.createFilePath}`}
                onSelect={() => void createAtPath(search.createFilePath!)}
                disabled={busy}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <FilePlusIcon className="size-3.5 shrink-0 text-ws-accent-soft" />
                <span className="min-w-0 flex-1 truncate text-[12px]">
                  Create file{" "}
                  <span className="font-mono text-ws-text">
                    {search.createFilePath}
                  </span>
                </span>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {!editMode && search.createFolderPath ? (
            <CommandGroup heading="Create">
              <CommandItem
                value={`create-folder ${search.createFolderPath}`}
                onSelect={() => void createFolderAtPath(search.createFolderPath!)}
                disabled={busy}
                className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
              >
                <FolderPlusIcon className="size-3.5 shrink-0 text-ws-accent-soft" />
                <span className="min-w-0 flex-1 truncate text-[12px]">
                  Create folder{" "}
                  <span className="font-mono text-ws-text">
                    {search.createFolderPath}
                  </span>
                </span>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {!editMode && showRecent ? (
            <CommandGroup heading="Recent">
              {search.recentPaths.map((path) => (
                <CommandItem
                  key={`recent:${path}`}
                  value={`recent:${path}`}
                  onSelect={() => openFile(path)}
                  className="group gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <ClockIcon className="size-3.5 shrink-0 opacity-60" />
                  <FileNavigatorRow path={path} />
                  {canEdit ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(event) => {
                        event.stopPropagation();
                        startRename(path, "file");
                      }}
                      className="ml-auto hidden rounded-sm p-1 text-ws-text-muted hover:bg-ws-panel hover:text-ws-text group-data-[selected=true]:inline-flex"
                      aria-label={`Rename ${fileBaseName(path)}`}
                    >
                      <FilePenIcon className="size-3" />
                    </button>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!editMode && showOpenEditors ? (
            <CommandGroup heading="Open editors">
              {openFilePaths.map((path) => (
                <CommandItem
                  key={`open:${path}`}
                  value={`open ${path}`}
                  onSelect={() => openFile(path)}
                  className="group gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <FileIcon fileName={fileBaseName(path)} autoAssign />
                  <FileNavigatorRow path={path} />
                  {canEdit ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(event) => {
                        event.stopPropagation();
                        startRename(path, "file");
                      }}
                      className="ml-auto hidden rounded-sm p-1 text-ws-text-muted hover:bg-ws-panel hover:text-ws-text group-data-[selected=true]:inline-flex"
                      aria-label={`Rename ${fileBaseName(path)}`}
                    >
                      <FilePenIcon className="size-3" />
                    </button>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!editMode && search.fileMatches.length > 0 ? (
            <CommandGroup heading="Files">
              {search.fileMatches.map((match) => (
                <CommandItem
                  key={`file:${match.path}`}
                  value={`file:${match.path}`}
                  onSelect={() => openFile(match.path)}
                  className="group gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <FileNavigatorItemIcon kind="file" path={match.path} />
                  <FileNavigatorRow path={match.path} query={query} />
                  {canEdit ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(event) => {
                        event.stopPropagation();
                        startRename(match.path, "file");
                      }}
                      className="ml-auto hidden rounded-sm p-1 text-ws-text-muted hover:bg-ws-panel hover:text-ws-text group-data-[selected=true]:inline-flex"
                      aria-label={`Rename ${fileBaseName(match.path)}`}
                    >
                      <FilePenIcon className="size-3" />
                    </button>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!editMode &&
          (search.browseFolders.length > 0 ||
            (canPasteInto && !browsePath && !search.isSearching)) ? (
            <CommandGroup heading={search.isSearching ? "Folders" : "Browse"}>
              {canPasteInto && !search.isSearching ? (
                <CommandItem
                  value="paste-root"
                  onSelect={() => void pasteIntoFolder("")}
                  className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <ScissorsIcon className="size-3.5 shrink-0 text-ws-accent-soft" />
                  <span className="text-[12px]">Move here (project root)</span>
                </CommandItem>
              ) : null}
              {!search.isSearching && browsePath ? (
                <CommandItem
                  value="navigate-up"
                  onSelect={navigateUp}
                  className="gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <FolderOpenIcon className="size-3.5 shrink-0 opacity-60" />
                  <span className="text-[12px]">..</span>
                  <span className="truncate text-[10px] text-ws-text-muted">
                    {fileParentDir(browsePath) || "Project root"}
                  </span>
                </CommandItem>
              ) : null}
              {search.browseFolders.map((folder) => (
                <CommandItem
                  key={`folder:${folder.path}`}
                  value={`folder:${folder.path}`}
                  onSelect={() => {
                    if (canPasteInto) {
                      void pasteIntoFolder(folder.path);
                      return;
                    }
                    navigateFolder(folder.path);
                  }}
                  className="group gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <FileNavigatorItemIcon kind="folder" path={folder.path} />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ws-text">
                    {folder.name}
                  </span>
                  {canEdit && !canPasteInto ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(event) => {
                        event.stopPropagation();
                        startRename(folder.path, "folder");
                      }}
                      className="hidden rounded-sm p-1 text-ws-text-muted hover:bg-ws-panel hover:text-ws-text group-data-[selected=true]:inline-flex"
                      aria-label={`Rename ${folder.name}`}
                    >
                      <FilePenIcon className="size-3" />
                    </button>
                  ) : null}
                  {canPasteInto ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-ws-text-muted">
                      <ScissorsIcon className="size-3" />
                      Move here
                    </span>
                  ) : (
                    <ChevronRightIcon className="size-3.5 shrink-0 opacity-50" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!editMode && search.browseFiles.length > 0 ? (
            <CommandGroup heading="In folder">
              {search.browseFiles.map((file) => (
                <CommandItem
                  key={`browse-file:${file.path}`}
                  value={`browse-file ${file.path}`}
                  onSelect={() => openFile(file.path)}
                  className="group gap-2 py-2 text-ws-text-secondary data-[selected=true]:bg-ws-hover data-[selected=true]:text-ws-text"
                >
                  <FileNavigatorItemIcon kind="file" path={file.path} />
                  <FileNavigatorRow path={file.path} />
                  {canEdit ? (
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(event) => {
                        event.stopPropagation();
                        startRename(file.path, "file");
                      }}
                      className="ml-auto hidden rounded-sm p-1 text-ws-text-muted hover:bg-ws-panel hover:text-ws-text group-data-[selected=true]:inline-flex"
                      aria-label={`Rename ${file.name}`}
                    >
                      <FilePenIcon className="size-3" />
                    </button>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!editMode && search.fileTruncated ? (
            <p className="px-3 py-2 text-[10px] text-ws-text-muted">
              Showing first {search.fileMatches.length} matches — refine your
              search.
            </p>
          ) : null}
        </CommandList>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ws-border-subtle px-3 py-1.5 text-[10px] text-ws-text-muted">
          {editMode ? (
            <>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeftIcon className="size-3" />
                Confirm
              </span>
              <span>Esc Cancel</span>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <CornerDownLeftIcon className="size-3" />
                Open
              </span>
              <span>↑↓ Navigate</span>
              {canEdit ? <span>F2 Rename</span> : null}
              {canEdit ? <span>Alt+A New file</span> : null}
              {canPasteInto ? <span>Move cut item into folder</span> : null}
              <span className="ml-auto inline-flex items-center gap-2">
                <kbd className="rounded border border-ws-border px-1 py-0.5 font-mono text-[9px]">
                  {modShortcut}
                </kbd>
                <kbd className="rounded border border-ws-border px-1 py-0.5 font-mono text-[9px]">
                  {shiftShortcut}
                </kbd>
                Esc
              </span>
            </>
          )}
        </div>
      </Command>
    </CommandDialog>
  );
}

/** @deprecated Use ProjectFileNavigatorDialog */
export const WorkspaceGoToFileDialog = ProjectFileNavigatorDialog;
