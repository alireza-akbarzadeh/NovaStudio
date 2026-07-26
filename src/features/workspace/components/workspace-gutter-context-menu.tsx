"use client";

import { useQuery } from "convex/react";
import { BugIcon, MessageCircleIcon, MessageCirclePlusIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { isDebuggableScriptPath } from "@/features/workspace/lib/debug-session";
import { useDebugStore } from "@/features/workspace/store/debug-store";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceGutterContextMenuProps = {
  projectId: string;
};

/**
 * Floating menu for glyph / line-number gutter right-click:
 * add line comment or toggle breakpoint.
 */
export function WorkspaceGutterContextMenu({
  projectId,
}: WorkspaceGutterContextMenuProps) {
  const menu = useWorkspaceStore((s) => s.gutterContextMenu);
  const close = useWorkspaceStore((s) => s.closeGutterContextMenu);
  const openCommentsPanel = useWorkspaceStore((s) => s.openCommentsPanel);
  const setActiveCommentThreadId = useWorkspaceStore(
    (s) => s.setActiveCommentThreadId,
  );
  const setCommentDraftLine = useWorkspaceStore((s) => s.setCommentDraftLine);
  const toggleBreakpoint = useDebugStore((s) => s.toggleBreakpoint);
  const getBreakpointsForPath = useDebugStore((s) => s.getBreakpointsForPath);
  const rootRef = useRef<HTMLDivElement>(null);

  const threads = useQuery(
    api.comments.listThreads,
    menu
      ? {
          projectId: projectId as Id<"projects">,
          filePath: menu.filePath,
          includeResolved: false,
          limit: 200,
        }
      : "skip",
  );

  const existing = menu
    ? (threads ?? []).find((t) => t.line === menu.line)
    : undefined;

  useEffect(() => {
    if (!menu) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    window.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointer, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer, true);
    };
  }, [close, menu]);

  if (!menu || typeof document === "undefined") return null;

  const hasBreakpoint = getBreakpointsForPath(menu.filePath).includes(
    menu.line,
  );
  const canBreakpoint = isDebuggableScriptPath(menu.filePath);

  const addComment = () => {
    openCommentsPanel();
    if (existing) {
      setActiveCommentThreadId(existing.id);
      setCommentDraftLine(null);
    } else {
      setActiveCommentThreadId(null);
      setCommentDraftLine(menu.line);
    }
    close();
  };

  const onToggleBreakpoint = () => {
    if (!canBreakpoint) {
      toast.message("Breakpoints need a code file", {
        description: "Open a .js, .jsx, .ts, or .tsx file.",
      });
      close();
      return;
    }
    toggleBreakpoint(menu.filePath, menu.line);
    close();
  };

  return createPortal(
    <div
      ref={rootRef}
      role="menu"
      aria-label={`Line ${menu.line} actions`}
      className={cn(
        "fixed z-[80] min-w-[200px] overflow-hidden rounded-md border border-ws-border bg-ws-panel p-1 shadow-lg",
      )}
      style={{
        left: Math.min(menu.x, window.innerWidth - 220),
        top: Math.min(menu.y, window.innerHeight - 120),
      }}
    >
      <p className="px-2 py-1 text-[10px] font-medium tracking-wide text-ws-text-muted uppercase">
        Line {menu.line}
      </p>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-ws-text hover:bg-ws-hover"
        onClick={addComment}
      >
        {existing ? (
          <MessageCircleIcon className="size-3.5 shrink-0 text-ws-accent" />
        ) : (
          <MessageCirclePlusIcon className="size-3.5 shrink-0 text-ws-accent" />
        )}
        {existing ? "Open comment" : "Add comment…"}
      </button>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[12px] text-ws-text hover:bg-ws-hover"
        onClick={onToggleBreakpoint}
      >
        <BugIcon className="size-3.5 shrink-0 text-[#e5484d]" />
        {hasBreakpoint ? "Remove breakpoint" : "Add breakpoint"}
      </button>
    </div>,
    document.body,
  );
}
