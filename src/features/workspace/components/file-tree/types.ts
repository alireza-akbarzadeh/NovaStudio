import type { Id } from "@/convex/_generated/dataModel";
import type { FileTreeNode } from "@/features/workspace/lib/file-tree";

export type PendingCreate = {
  parentId?: Id<"projectFiles">;
  kind: "file" | "folder";
};

export type WorkspaceFileTreeProps = {
  projectId: string;
};

export type VisibleTreeItem = {
  node: FileTreeNode;
  depth: number;
  parentId?: Id<"projectFiles">;
};

export type FileTreeMenuContentProps = {
  isFolder: boolean;
  canPaste: boolean;
  canEdit?: boolean;
  onNewFile: () => void;
  onNewFolder: () => void;
  onUpload?: () => void;
  onOpen: () => void;
  onOpenInTerminal: () => void;
  onAddToChat: () => void;
  onAddToNewChat: () => void;
  onFindInFolder: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onCopyPath: () => void;
  onCopyRelativePath: () => void;
  onRename: () => void;
  onDelete: () => void;
  menuType?: "context" | "dropdown";
  showItemActions?: boolean;
};

export type FileTreeItemProps = {
  node: FileTreeNode;
  projectId: string;
  depth: number;
  openFolderIds: Set<Id<"projectFiles">>;
  onToggleFolder: (folderId: Id<"projectFiles">) => void;
  focusedId: Id<"projectFiles"> | null;
  onFocusItem: (id: Id<"projectFiles">) => void;
  selectedIds: Set<Id<"projectFiles">>;
  onSelectItem: (
    id: Id<"projectFiles">,
    modifiers?: { shiftKey?: boolean; modKey?: boolean },
  ) => void;
  pendingCreate: PendingCreate | null;
  onStartCreate: (kind: "file" | "folder", parentId?: Id<"projectFiles">) => void;
  renderPendingCreate: (
    parentId: Id<"projectFiles"> | undefined,
    depth: number,
  ) => React.ReactNode;
  canPaste: boolean;
  canEdit: boolean;
  cutPath: string | null;
  pendingRenameId: Id<"projectFiles"> | null;
  onPendingRenameHandled: () => void;
  pendingDeleteId: Id<"projectFiles"> | null;
  onPendingDeleteHandled: () => void;
  onCut: (path: string) => void;
  onCopy: (path: string) => void;
  onPaste: (targetParentId?: Id<"projectFiles">) => Promise<void>;
  onDuplicate: (path: string) => Promise<void>;
  onCopyPath: (path: string) => void;
  onCopyRelativePath: (path: string) => void;
  onOpenInTerminal: (folderPath: string) => void;
  onFindInFolder: (folderPath?: string) => void;
  onAddToChat: (path: string, kind: "file" | "folder") => void;
  onAddToNewChat: (path: string, kind: "file" | "folder") => void;
  onUpload?: (targetParentId?: Id<"projectFiles">) => void;
  dropTargetId?: "root" | Id<"projectFiles"> | null;
  dragSourcePath?: string | null;
  dragSourcePaths?: Set<string>;
  onTreeDragStart?: (payload: {
    path: string;
    kind: "file" | "folder";
    parentId?: Id<"projectFiles">;
    paths: string[];
  }) => void;
  onTreeDragEnd?: () => void;
  onDeleteItems?: (paths: string[]) => Promise<void>;
  files?: Array<{
    _id: Id<"projectFiles">;
    path: string;
    kind: "file" | "folder";
  }>;
  onItemDragOver?: (
    event: React.DragEvent,
    targetId: "root" | Id<"projectFiles">,
  ) => void;
  onItemDragLeave?: (
    event: React.DragEvent,
    targetId: "root" | Id<"projectFiles">,
  ) => void;
  onItemDrop?: (
    event: React.DragEvent,
    targetParentId: Id<"projectFiles"> | undefined,
  ) => void;
  parentId?: Id<"projectFiles">;
  highlightQuery?: string;
  /** When true, render only this row (used by virtualized file tree). */
  flat?: boolean;
};
