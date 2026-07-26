"use client";

import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { isDebuggableScriptPath } from "@/features/workspace/lib/debug-session";
import { useDebugStore } from "@/features/workspace/store/debug-store";

type UseMonacoBreakpointsArgs = {
  filePath: string;
  /** When false, skip chrome interactions (split secondary pane). */
  enabled?: boolean;
};

function breakpointDecorations(lines: number[]) {
  return lines.map((line) => ({
    range: {
      startLineNumber: line,
      startColumn: 1,
      endLineNumber: line,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      linesDecorationsClassName: "polaris-breakpoint-line",
      glyphMarginClassName: "polaris-breakpoint-glyph",
      glyphMarginHoverMessage: { value: "Breakpoint" },
      overviewRuler: {
        color: "#e5484d",
        position: 1,
      },
    },
  }));
}

/**
 * Toggle breakpoints by clicking the line-number gutter (glyph margin stays
 * reserved for line comments). Syncs decorations with the debug store.
 */
export function useMonacoBreakpoints({
  filePath,
  enabled = true,
}: UseMonacoBreakpointsArgs) {
  const lines = useDebugStore(
    (s) => s.breakpointsByPath[filePath] ?? EMPTY_LINES,
  );
  const toggleBreakpoint = useDebugStore((s) => s.toggleBreakpoint);
  const decorationIdsRef = useRef<string[]>([]);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  // Attach line-number click handler once per editor.
  useEffect(() => {
    if (!enabled || !filePath || !isDebuggableScriptPath(filePath)) return;

    let disposed = false;
    let mouseDisposable: { dispose: () => void } | null = null;
    let pollId = 0;

    const attach = (ed: editor.IStandaloneCodeEditor) => {
      decorationIdsRef.current = ed.deltaDecorations(
        decorationIdsRef.current,
        breakpointDecorations(linesRef.current),
      );

      // Monaco MouseTargetType.GUTTER_LINE_NUMBERS === 3
      mouseDisposable = ed.onMouseDown((event) => {
        if (event.target.type !== 3) return;
        const line = event.target.position?.lineNumber;
        if (!line) return;
        toggleBreakpoint(filePath, line);
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
      const ed = getActiveMonacoEditor(filePath);
      if (ed && decorationIdsRef.current.length > 0) {
        decorationIdsRef.current = ed.deltaDecorations(
          decorationIdsRef.current,
          [],
        );
      }
      decorationIdsRef.current = [];
    };
  }, [enabled, filePath, toggleBreakpoint]);

  // Refresh decorations when breakpoints change.
  useEffect(() => {
    if (!enabled || !filePath || !isDebuggableScriptPath(filePath)) return;
    const ed = getActiveMonacoEditor(filePath);
    if (!ed) return;
    decorationIdsRef.current = ed.deltaDecorations(
      decorationIdsRef.current,
      breakpointDecorations(lines),
    );
  }, [enabled, filePath, lines]);
}

const EMPTY_LINES: number[] = [];
