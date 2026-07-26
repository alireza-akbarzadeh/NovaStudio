"use client";

import { useQuery } from "convex/react";
import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

type UseFileLineCommentsArgs = {
  projectId: string;
  filePath: string;
  /** When false, skip chrome interactions (split secondary pane). */
  enabled?: boolean;
};

type CommentThreadGlyph = {
  id: string;
  line: number;
  body: string;
  author: { name: string };
};

function decorationOptions(thread: CommentThreadGlyph) {
  return {
    range: {
      startLineNumber: thread.line,
      startColumn: 1,
      endLineNumber: thread.line,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      glyphMarginClassName: "polaris-line-comment-glyph",
      className: "polaris-line-comment-line",
      glyphMarginHoverMessage: {
        value: `${thread.author.name}: ${thread.body.slice(0, 120)}`,
      },
    },
  };
}

/**
 * Syncs Figma-style comment glyphs into Monaco for the active file.
 * Left-click a comment glyph (or Alt+gutter) opens that thread;
 * right-click is handled by the shared gutter context menu.
 */
export function useFileLineComments({
  projectId,
  filePath,
  enabled = true,
}: UseFileLineCommentsArgs) {
  const openCommentsPanel = useWorkspaceStore((s) => s.openCommentsPanel);
  const setActiveCommentThreadId = useWorkspaceStore(
    (s) => s.setActiveCommentThreadId,
  );
  const setCommentDraftLine = useWorkspaceStore((s) => s.setCommentDraftLine);
  const openGutterContextMenu = useWorkspaceStore(
    (s) => s.openGutterContextMenu,
  );

  const threads = useQuery(
    api.comments.listThreads,
    enabled
      ? {
          projectId: projectId as Id<"projects">,
          filePath,
          includeResolved: false,
          limit: 200,
        }
      : "skip",
  );

  const decorationIdsRef = useRef<string[]>([]);
  const threadsRef = useRef(threads);
  threadsRef.current = threads;

  useEffect(() => {
    if (!enabled || !filePath) return;

    let disposed = false;
    let mouseDisposable: { dispose: () => void } | null = null;
    let actionDisposable: { dispose: () => void } | null = null;
    let pollId = 0;

    const openForLine = (line: number) => {
      const match = (threadsRef.current ?? []).find((t) => t.line === line);
      openCommentsPanel();
      if (match) {
        setActiveCommentThreadId(match.id);
        setCommentDraftLine(null);
      } else {
        setActiveCommentThreadId(null);
        setCommentDraftLine(line);
      }
    };

    const applyDecorations = (ed: editor.IStandaloneCodeEditor) => {
      const list = threadsRef.current ?? [];
      decorationIdsRef.current = ed.deltaDecorations(
        decorationIdsRef.current,
        list.map(decorationOptions),
      );
    };

    const attach = (ed: editor.IStandaloneCodeEditor) => {
      applyDecorations(ed);

      mouseDisposable = ed.onMouseDown((event) => {
        if (event.target.type !== 2) return;
        const line = event.target.position?.lineNumber;
        if (!line) return;

        if (event.event.rightButton) {
          event.event.preventDefault();
          event.event.stopPropagation();
          openGutterContextMenu({
            x: event.event.posx,
            y: event.event.posy,
            line,
            filePath,
          });
          return;
        }

        // Alt+click comment glyph → open thread / draft (left-click is breakpoint).
        if (!event.event.leftButton || !event.event.altKey) return;
        event.event.preventDefault();
        event.event.stopPropagation();
        openForLine(line);
      });

      actionDisposable = ed.addAction({
        id: "polaris.addLineComment",
        label: "Add Line Comment",
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.6,
        run: (editorInstance) => {
          const line = editorInstance.getPosition()?.lineNumber;
          if (!line) return;
          openForLine(line);
        },
      });
    };

    const tryAttach = () => {
      if (disposed) return;
      const ed = getActiveMonacoEditor(filePath);
      if (!ed) {
        pollId = window.setTimeout(tryAttach, 120);
        return;
      }
      attach(ed);
    };

    tryAttach();

    return () => {
      disposed = true;
      window.clearTimeout(pollId);
      mouseDisposable?.dispose();
      actionDisposable?.dispose();
      const ed = getActiveMonacoEditor(filePath);
      if (ed && decorationIdsRef.current.length > 0) {
        decorationIdsRef.current = ed.deltaDecorations(
          decorationIdsRef.current,
          [],
        );
      }
      decorationIdsRef.current = [];
    };
  }, [
    enabled,
    filePath,
    openCommentsPanel,
    openGutterContextMenu,
    setActiveCommentThreadId,
    setCommentDraftLine,
  ]);

  useEffect(() => {
    if (!enabled || !filePath) return;
    const ed = getActiveMonacoEditor(filePath);
    if (!ed) return;
    decorationIdsRef.current = ed.deltaDecorations(
      decorationIdsRef.current,
      (threads ?? []).map(decorationOptions),
    );
  }, [enabled, filePath, threads]);
}
