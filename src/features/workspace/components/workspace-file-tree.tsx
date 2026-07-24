"use client";

import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu";

import { FileTreeItem } from "./file-tree/file-tree-item";
import { FileTreeMenuContent } from "./file-tree/file-tree-menu";
import { TreeToolbar } from "./file-tree/tree-toolbar";
import type { WorkspaceFileTreeProps } from "./file-tree/types";
import { useWorkspaceFileTree } from "../hooks/use-workspace-file-tree";

export function WorkspaceFileTree({ projectId }: WorkspaceFileTreeProps) {
  const tree = useWorkspaceFileTree(projectId);

  if (tree.files === undefined) {
    return (
      <p className="px-3 py-2 text-[11px] text-ws-text-muted">Loading files…</p>
    );
  }

  if (tree.tree?.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TreeToolbar
          canEdit={tree.canEdit}
          onNewFile={() => tree.startCreate("file")}
          onNewFolder={() => tree.startCreate("folder")}
          onCollapseAll={tree.collapseAll}
          filter={tree.treeFilter}
          onFilterChange={tree.setTreeFilter}
        />
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className="flex min-h-24 flex-1 flex-col p-1.5">
              {tree.canEdit ? tree.renderPendingCreate(undefined, 0) : null}
              {!tree.pendingCreate ? (
                <p className="px-2 py-2 text-[11px] text-ws-text-muted">
                  No files yet
                </p>
              ) : null}
            </div>
          </ContextMenuTrigger>
          <FileTreeMenuContent {...tree.backgroundMenuProps} />
        </ContextMenu>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TreeToolbar
        canEdit={tree.canEdit}
        onNewFile={() => tree.startCreate("file")}
        onNewFolder={() => tree.startCreate("folder")}
        onCollapseAll={tree.collapseAll}
        filter={tree.treeFilter}
        onFilterChange={tree.setTreeFilter}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <nav
            aria-label="Project files"
            className="flex-1 overflow-auto p-1.5 outline-none focus-visible:outline-none"
            key={tree.collapseKey}
            onKeyDown={tree.handleTreeKeyDown}
          >
            {tree.isFiltering && tree.visibleTree.length === 0 ? (
              <p className="px-2 py-2 text-[11px] text-ws-text-muted">
                No matching files
              </p>
            ) : null}
            {tree.visibleTree.map((node) => (
              <FileTreeItem
                key={node.id}
                node={node}
                projectId={projectId}
                depth={0}
                openFolderIds={tree.openFolderIds}
                onToggleFolder={tree.toggleFolder}
                focusedId={tree.focusedId}
                onFocusItem={tree.setFocusedId}
                pendingCreate={tree.isFiltering ? null : tree.pendingCreate}
                onStartCreate={tree.startCreate}
                renderPendingCreate={tree.renderPendingCreate}
                canPaste={tree.canPaste}
                canEdit={tree.canEdit}
                cutPath={tree.cutPath}
                pendingRenameId={tree.pendingRenameId}
                onPendingRenameHandled={() => tree.setPendingRenameId(null)}
                pendingDeleteId={tree.pendingDeleteId}
                onPendingDeleteHandled={() => tree.setPendingDeleteId(null)}
                onCut={tree.cutItem}
                onCopy={tree.copyItem}
                onPaste={tree.pasteInto}
                onDuplicate={tree.duplicateItem}
                onCopyPath={(path) => void tree.copyPathToClipboard(path, "Path")}
                onCopyRelativePath={(path) =>
                  void tree.copyPathToClipboard(path, "Relative path")
                }
                onOpenInTerminal={tree.openInTerminal}
                onFindInFolder={tree.findInFolder}
                onAddToChat={(path, kind) => tree.attachToChat(path, kind, false)}
                onAddToNewChat={(path, kind) =>
                  tree.attachToChat(path, kind, true)
                }
                highlightQuery={tree.treeFilter}
              />
            ))}
            {!tree.isFiltering && tree.canEdit
              ? tree.renderPendingCreate(undefined, 0)
              : null}
          </nav>
        </ContextMenuTrigger>
        <FileTreeMenuContent {...tree.backgroundMenuProps} />
      </ContextMenu>
    </div>
  );
}
