"use client";

import {
  FilePlusIcon,
  FolderPlusIcon,
  ListCollapseIcon,
  SearchIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TreeToolbarProps = {
  onNewFile: () => void;
  onNewFolder: () => void;
  onUpload?: () => void;
  onCollapseAll: () => void;
  canEdit: boolean;
  filter: string;
  onFilterChange: (value: string) => void;
};

export function TreeToolbar({
  onNewFile,
  onNewFolder,
  onUpload,
  onCollapseAll,
  canEdit,
  filter,
  onFilterChange,
}: TreeToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasFilter = filter.trim().length > 0;
  const showSearch = searchOpen || hasFilter;

  useEffect(() => {
    if (!showSearch) return;
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [showSearch]);

  const openSearch = () => {
    setSearchOpen(true);
  };

  const closeSearch = () => {
    onFilterChange("");
    setSearchOpen(false);
  };

  return (
    <div className="shrink-0 border-b border-ws-border-subtle">
      <div className="flex items-center gap-0.5 px-1 py-1">
        <TreeToolbarButton
          label="Search Files"
          onClick={() => {
            if (showSearch && !hasFilter) {
              closeSearch();
              return;
            }
            openSearch();
          }}
          active={showSearch}
        >
          <SearchIcon className="size-3.5" />
        </TreeToolbarButton>
        {canEdit ? (
          <>
            <TreeToolbarButton label="New File" onClick={onNewFile}>
              <FilePlusIcon className="size-3.5" />
            </TreeToolbarButton>
            <TreeToolbarButton label="New Folder" onClick={onNewFolder}>
              <FolderPlusIcon className="size-3.5" />
            </TreeToolbarButton>
            {onUpload ? (
              <TreeToolbarButton label="Upload Files" onClick={onUpload}>
                <UploadIcon className="size-3.5" />
              </TreeToolbarButton>
            ) : null}
          </>
        ) : null}
        <TreeToolbarButton label="Collapse All" onClick={onCollapseAll}>
          <ListCollapseIcon className="size-3.5" />
        </TreeToolbarButton>
      </div>
      {showSearch ? (
        <div className="relative px-1.5 pb-1.5">
          <SearchIcon className="pointer-events-none mt-[-2.5px] absolute top-1/2 left-3.5 size-3 -translate-y-1/2 text-ws-text-muted" />
          <Input
            ref={searchInputRef}
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                closeSearch();
              }
            }}
            placeholder="Search files…"
            aria-label="Search files"
            className="h-6 border-ws-border bg-ws-bg pr-7 pl-7 text-[11px] text-ws-text placeholder:text-ws-text-muted focus-visible:border-ws-accent focus-visible:ring-0"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={closeSearch}
            className="absolute top-1/2 right-3.5 mt-[-2.5px] -translate-y-1/2 rounded-sm p-0.5 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
          >
            <XIcon className="size-3" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TreeToolbarButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      onClick={onClick}
      className={cn(
        "size-6 rounded-sm text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
        active && "bg-ws-hover text-ws-text",
      )}
    >
      {children}
    </Button>
  );
}
