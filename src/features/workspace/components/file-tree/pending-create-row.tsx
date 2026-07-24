"use client";

import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useState } from "react";

import { RenameInput } from "./rename-input";

type PendingCreateRowProps = {
  depth: number;
  kind: "file" | "folder";
  defaultName: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
};

export function PendingCreateRow({
  depth,
  kind,
  defaultName,
  onCommit,
  onCancel,
}: PendingCreateRowProps) {
  const [value, setValue] = useState(defaultName);
  const paddingLeft = kind === "folder" ? 8 + depth * 12 : 20 + depth * 12;

  return (
    <div
      className="flex items-center gap-1 py-0.5 pr-1"
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      {kind === "folder" ? (
        <>
          <span className="size-3 shrink-0" />
          <span className="size-3.5 shrink-0 [&_svg]:size-full">
            <FolderIcon folderName={value || "folder"} />
          </span>
        </>
      ) : (
        <span className="size-3.5 shrink-0 [&_svg]:size-full">
          <FileIcon fileName={value || "file"} autoAssign />
        </span>
      )}
      <RenameInput
        value={value}
        onChange={setValue}
        onCommit={() => onCommit(value)}
        onCancel={onCancel}
        selectOnFocus
      />
    </div>
  );
}
