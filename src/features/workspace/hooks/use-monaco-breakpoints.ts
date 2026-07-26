"use client";

import type { editor } from "monaco-editor";
import { KeyCode } from "monaco-editor";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

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
      glyphMarginHoverMessage: { value: "Breakpoint — click to remove" },
      overviewRuler: {
        color: "#e5484d",
        position: 1,
      },
    },
  }));
}

/**
 * Toggle breakpoints by clicking the glyph margin (left of line numbers),
 * matching VS Code. Also supports F9 and line-number clicks.
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

  useEffect(() => {
    if (!enabled || !filePath) return;

    let disposed = false;
    let mouseDisposable: { dispose: () => void } | null = null;
    let actionDisposable: { dispose: () => void } | null = null;
    let pollId = 0;

    const toggleAt = (line: number) => {
      if (!isDebuggableScriptPath(filePath)) {
        toast.message("Breakpoints need a code file", {
          description: "Open a .js, .jsx, .ts, or .tsx file.",
        });
        return;
      }
      toggleBreakpoint(filePath, line);
    };

    const attach = (ed: editor.IStandaloneCodeEditor) => {
      if (isDebuggableScriptPath(filePath)) {
        decorationIdsRef.current = ed.deltaDecorations(
          decorationIdsRef.current,
          breakpointDecorations(linesRef.current),
        );
      }

      // Glyph margin (2) or line numbers (3) — left-click toggles BP.
      // Alt+glyph is reserved for line comments.
      mouseDisposable = ed.onMouseDown((event) => {
        const type = event.target.type;
        if (type !== 2 && type !== 3) return;
        if (type === 2 && event.event.altKey) return;
        const line = event.target.position?.lineNumber;
        if (!line) return;
        event.event.preventDefault();
        event.event.stopPropagation();
        toggleAt(line);
      });

      actionDisposable = ed.addAction({
        id: "polaris.toggleBreakpoint",
        label: "Toggle Breakpoint",
        keybindings: [KeyCode.F9],
        contextMenuGroupId: "navigation",
        contextMenuOrder: 1.5,
        run: (editorInstance) => {
          const line = editorInstance.getPosition()?.lineNumber;
          if (!line) return;
          toggleAt(line);
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
  }, [enabled, filePath, toggleBreakpoint]);

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
