"use client";

import { useMonaco } from "@monaco-editor/react";
import { MarkerSeverity } from "monaco-editor";
import { useEffect, useState } from "react";

export type ProblemSeverity = "error" | "warning" | "info";

export type WorkspaceProblem = {
  id: string;
  path: string;
  fileName: string;
  message: string;
  severity: ProblemSeverity;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  source?: string;
  code?: string;
};

function severityFromMarker(severity: MarkerSeverity): ProblemSeverity | null {
  if (severity === MarkerSeverity.Error) return "error";
  if (severity === MarkerSeverity.Warning) return "warning";
  if (severity === MarkerSeverity.Info) return "info";
  return null;
}

function pathFromResource(resourcePath: string): string | null {
  const cleaned = resourcePath.replace(/^\/+/, "");
  if (!cleaned) return null;
  // Ignore Monaco extras / shims / diff buffers.
  if (cleaned.startsWith("node_modules/")) return null;
  if (cleaned.startsWith("diff-original/")) return null;
  if (cleaned.startsWith("diff-modified/")) return null;
  return cleaned;
}

function fileNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}

function collectProblems(monaco: NonNullable<ReturnType<typeof useMonaco>>): WorkspaceProblem[] {
  const markers = monaco.editor.getModelMarkers({});
  const problems: WorkspaceProblem[] = [];

  for (const marker of markers) {
    const severity = severityFromMarker(marker.severity);
    if (!severity) continue;

    const path = pathFromResource(marker.resource.path);
    if (!path) continue;

    const code =
      marker.code == null
        ? undefined
        : typeof marker.code === "string"
          ? marker.code
          : String(marker.code.value);

    problems.push({
      id: `${path}:${marker.startLineNumber}:${marker.startColumn}:${marker.message}:${code ?? ""}`,
      path,
      fileName: fileNameFromPath(path),
      message: marker.message,
      severity,
      line: marker.startLineNumber,
      column: marker.startColumn,
      endLine: marker.endLineNumber,
      endColumn: marker.endColumn,
      source: marker.source,
      code,
    });
  }

  problems.sort((a, b) => {
    const severityRank = { error: 0, warning: 1, info: 2 };
    const bySeverity = severityRank[a.severity] - severityRank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const byPath = a.path.localeCompare(b.path);
    if (byPath !== 0) return byPath;
    if (a.line !== b.line) return a.line - b.line;
    return a.column - b.column;
  });

  return problems;
}

/** Live Monaco marker list for the Problems panel / status bar. */
export function useMonacoProblems() {
  const monaco = useMonaco();
  const [problems, setProblems] = useState<WorkspaceProblem[]>([]);

  useEffect(() => {
    if (!monaco) return;

    const refresh = () => {
      setProblems(collectProblems(monaco));
    };

    refresh();
    const disposable = monaco.editor.onDidChangeMarkers(() => {
      refresh();
    });

    // Models can appear after the first paint (tab open).
    const modelDisposable = monaco.editor.onDidCreateModel(() => {
      refresh();
    });

    return () => {
      disposable.dispose();
      modelDisposable.dispose();
    };
  }, [monaco]);

  const errorCount = problems.filter((p) => p.severity === "error").length;
  const warningCount = problems.filter((p) => p.severity === "warning").length;
  const infoCount = problems.filter((p) => p.severity === "info").length;

  return { problems, errorCount, warningCount, infoCount };
}
