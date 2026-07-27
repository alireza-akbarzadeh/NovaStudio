"use client";

import type { editor } from "monaco-editor";
import { useEffect, useRef } from "react";

import type { GitHubBlameLine } from "@/convex/githubBlame";
import { formatBlameRelativeDate } from "@/features/github/lib/format-blame-date";
import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";

type UseMonacoBlameArgs = {
  filePath: string;
  lines: GitHubBlameLine[];
  enabled: boolean;
};

function blameLabel(line: GitHubBlameLine): string {
  const age = formatBlameRelativeDate(line.committedDate);
  const author =
    line.authorName.length > 18
      ? `${line.authorName.slice(0, 16)}…`
      : line.authorName;
  return `${author} · ${line.shortSha} · ${age}`;
}

function blameHover(line: GitHubBlameLine): string {
  const when = line.committedDate
    ? new Date(line.committedDate).toLocaleString()
    : "";
  return [
    `${line.authorName} · ${line.shortSha}`,
    line.message,
    when,
    "Click to open commit on GitHub",
  ]
    .filter(Boolean)
    .join("\n");
}

function blameDecorations(lines: GitHubBlameLine[]) {
  return lines.map((line) => ({
    range: {
      startLineNumber: line.line,
      startColumn: 1,
      endLineNumber: line.line,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      after: {
        content: `  ${blameLabel(line)}`,
        inlineClassName: "polaris-blame-inline",
      },
      hoverMessage: { value: blameHover(line) },
    },
  }));
}

/**
 * Inline Git blame annotations at the end of each line (GitHub-linked projects).
 */
export function useMonacoBlame({
  filePath,
  lines,
  enabled,
}: UseMonacoBlameArgs) {
  const decorationIdsRef = useRef<string[]>([]);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    if (!enabled || !filePath) return;

    let disposed = false;
    let mouseDisposable: { dispose: () => void } | null = null;
    let pollId = 0;

    const attach = (ed: editor.IStandaloneCodeEditor) => {
      decorationIdsRef.current = ed.deltaDecorations(
        decorationIdsRef.current,
        blameDecorations(linesRef.current),
      );

      mouseDisposable = ed.onMouseDown((event) => {
        const element = event.target.element;
        const blameEl = element?.closest(".polaris-blame-inline");
        if (!blameEl) return;

        const lineNumber = event.target.position?.lineNumber;
        if (!lineNumber) return;

        const blameLine = linesRef.current.find((row) => row.line === lineNumber);
        if (!blameLine?.url) return;

        event.event.preventDefault();
        event.event.stopPropagation();
        window.open(blameLine.url, "_blank", "noopener,noreferrer");
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
  }, [enabled, filePath]);

  useEffect(() => {
    if (!enabled || !filePath) return;
    const ed = getActiveMonacoEditor(filePath);
    if (!ed) return;
    decorationIdsRef.current = ed.deltaDecorations(
      decorationIdsRef.current,
      blameDecorations(lines),
    );
  }, [enabled, filePath, lines]);
}
