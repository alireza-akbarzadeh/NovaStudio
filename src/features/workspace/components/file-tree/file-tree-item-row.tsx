"use client";

import {
  DefaultFolderOpenedIcon,
  FileIcon,
  FolderIcon,
} from "@react-symbols/icons/utils";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import { HighlightedText } from "@/features/workspace/components/highlighted-text";
import { cn } from "@/lib/utils";

import { RenameInput } from "./rename-input";

type FileTreeItemRowProps = {
  isFolder: boolean;
  open: boolean;
  depth: number;
  nodeName: string;
  active: boolean;
  isFocused: boolean;
  isCut: boolean;
  renaming: boolean;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onStartRename: () => void;
  onFocusItem: () => void;
  onToggleFolder?: () => void;
  onOpenPreview?: () => void;
  onOpenPermanent?: () => void;
  renameInputRef: React.RefObject<HTMLInputElement | null>;
  focusProps: {
    "data-tree-item-id": string;
    tabIndex: number;
    onFocus: () => void;
  };
  highlightQuery: string;
};

export function FileTreeItemRow({
  isFolder,
  open,
  depth,
  nodeName,
  active,
  isFocused,
  isCut,
  renaming,
  renameValue,
  onRenameValueChange,
  onCommitRename,
  onCancelRename,
  onStartRename,
  onFocusItem,
  onToggleFolder,
  onOpenPreview,
  onOpenPermanent,
  renameInputRef,
  focusProps,
  highlightQuery,
}: FileTreeItemRowProps) {
  if (isFolder) {
    return (
      <button
        type="button"
        {...focusProps}
        onClick={() => {
          onFocusItem();
          onToggleFolder?.();
        }}
        onDoubleClick={onStartRename}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1 rounded-sm py-0.5 pr-1 text-left text-[12px] text-ws-text-secondary hover:bg-ws-hover focus:outline-none focus-visible:ring-1 focus-visible:ring-ws-accent",
          isFocused && "bg-ws-hover text-ws-text",
          isCut && "opacity-50",
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {open ? (
          <ChevronDownIcon className="size-3 shrink-0 text-ws-text-muted" />
        ) : (
          <ChevronRightIcon className="size-3 shrink-0 text-ws-text-muted" />
        )}
        <span className="size-3.5 shrink-0 [&_svg]:size-full">
          {open ? (
            <DefaultFolderOpenedIcon />
          ) : (
            <FolderIcon folderName={nodeName} />
          )}
        </span>
        {renaming ? (
          <RenameInput
            ref={renameInputRef}
            value={renameValue}
            onChange={onRenameValueChange}
            onCommit={onCommitRename}
            onCancel={onCancelRename}
          />
        ) : (
          <HighlightedText text={nodeName} query={highlightQuery} />
        )}
      </button>
    );
  }

  if (renaming) {
    return (
      <div
        className="flex min-w-0 flex-1 items-center gap-1 py-0.5 pr-1"
        style={{ paddingLeft: `${20 + depth * 12}px` }}
      >
        <span className="size-3.5 shrink-0 [&_svg]:size-full">
          <FileIcon fileName={nodeName} autoAssign />
        </span>
        <RenameInput
          ref={renameInputRef}
          value={renameValue}
          onChange={onRenameValueChange}
          onCommit={onCommitRename}
          onCancel={onCancelRename}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      {...focusProps}
      onClick={() => {
        onFocusItem();
        onOpenPreview?.();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        onOpenPermanent?.();
      }}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1 rounded-sm py-0.5 pr-1 text-left text-[12px] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ws-accent",
        active || isFocused
          ? "bg-ws-hover text-ws-text"
          : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
        isCut && "opacity-50",
      )}
      style={{ paddingLeft: `${20 + depth * 12}px` }}
    >
      <span className="size-3.5 shrink-0 [&_svg]:size-full">
        <FileIcon fileName={nodeName} autoAssign />
      </span>
      <HighlightedText text={nodeName} query={highlightQuery} />
    </button>
  );
}
