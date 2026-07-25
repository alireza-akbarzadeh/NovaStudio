import type { Id } from "@/convex/_generated/dataModel";
import type { FileTreeNode } from "@/features/workspace/lib/file-tree";

import type { FileTreeMenuContentProps } from "./types";

type BuildItemMenuPropsParams = {
  node: FileTreeNode;
  isFolder: boolean;
  canPaste: boolean;
  canEdit: boolean;
  parentId?: Id<"projectFiles">;
  onOpenFile: () => void;
  onStartCreate: (kind: "file" | "folder", parentId?: Id<"projectFiles">) => void;
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
  startRename: () => void;
  openDeleteDialog: () => void;
};

export function buildItemMenuProps({
  node,
  isFolder,
  canPaste,
  canEdit,
  parentId,
  onOpenFile,
  onStartCreate,
  onCut,
  onCopy,
  onPaste,
  onDuplicate,
  onCopyPath,
  onCopyRelativePath,
  onOpenInTerminal,
  onFindInFolder,
  onAddToChat,
  onAddToNewChat,
  onUpload,
  startRename,
  openDeleteDialog,
}: BuildItemMenuPropsParams): FileTreeMenuContentProps {
  const pasteTargetId = isFolder ? node.id : parentId;

  return {
    isFolder,
    canPaste,
    canEdit,
    onNewFile: () => onStartCreate("file", isFolder ? node.id : undefined),
    onNewFolder: () => onStartCreate("folder", isFolder ? node.id : undefined),
    onUpload: onUpload
      ? () => onUpload(isFolder ? node.id : parentId)
      : undefined,
    onOpen: () => {
      if (!isFolder) {
        onOpenFile();
      }
    },
    onOpenInTerminal: () => onOpenInTerminal(node.path),
    onAddToChat: () => onAddToChat(node.path, node.kind),
    onAddToNewChat: () => onAddToNewChat(node.path, node.kind),
    onFindInFolder: () => onFindInFolder(isFolder ? node.path : undefined),
    onCut: () => onCut(node.path),
    onCopy: () => onCopy(node.path),
    onPaste: () => void onPaste(pasteTargetId),
    onDuplicate: () => void onDuplicate(node.path),
    onCopyPath: () => onCopyPath(node.path),
    onCopyRelativePath: () => onCopyRelativePath(node.path),
    onRename: startRename,
    onDelete: openDeleteDialog,
  };
}
