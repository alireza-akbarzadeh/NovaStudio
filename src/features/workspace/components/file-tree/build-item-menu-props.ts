import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import type { Id } from "@/convex/_generated/dataModel";
import type { FileTreeNode } from "@/features/workspace/lib/file-tree";

import type { FileTreeMenuContentProps } from "./types";

type BuildItemMenuPropsParams = {
  node: FileTreeNode;
  isFolder: boolean;
  href: string;
  canPaste: boolean;
  canEdit: boolean;
  parentId?: Id<"projectFiles">;
  router: AppRouterInstance;
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
  startRename: () => void;
  openDeleteDialog: () => void;
};

export function buildItemMenuProps({
  node,
  isFolder,
  href,
  canPaste,
  canEdit,
  parentId,
  router,
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
    onOpen: () => {
      if (!isFolder) {
        router.push(href);
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
