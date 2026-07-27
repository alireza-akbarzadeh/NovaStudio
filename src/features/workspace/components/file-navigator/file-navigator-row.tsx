"use client";

import { FileIcon } from "@react-symbols/icons/utils";
import { FolderIcon } from "lucide-react";

import { HighlightedText } from "@/features/workspace/components/highlighted-text";
import { cn } from "@/lib/utils";

import { fileBaseName, fileParentDir } from "./file-navigator-utils";

type FileNavigatorRowProps = {
  path: string;
  query?: string;
  className?: string;
};

export function FileNavigatorRow({
  path,
  query = "",
  className,
}: FileNavigatorRowProps) {
  const name = fileBaseName(path);
  const dir = fileParentDir(path);

  return (
    <span
      className={cn(
        "flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden",
        className,
      )}
    >
      <span className="shrink-0 text-[12px] font-medium text-ws-text">
        <HighlightedText text={name} query={query} />
      </span>
      {dir ? (
        <span className="min-w-0 truncate text-[10px] text-ws-text-muted">
          {dir}
        </span>
      ) : null}
    </span>
  );
}

type FileNavigatorItemIconProps = {
  kind: "file" | "folder";
  path: string;
  className?: string;
};

export function FileNavigatorItemIcon({
  kind,
  path,
  className,
}: FileNavigatorItemIconProps) {
  if (kind === "folder") {
    return (
      <FolderIcon
        className={cn("size-3.5 shrink-0 text-ws-text-muted", className)}
      />
    );
  }

  return (
    <span className={cn("size-3.5 shrink-0 [&_svg]:size-full", className)}>
      <FileIcon fileName={fileBaseName(path)} autoAssign />
    </span>
  );
}
