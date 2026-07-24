"use client";

import {
  CircleAlertIcon,
  CircleXIcon,
  InfoIcon,
} from "lucide-react";

import { useEditorTabs } from "@/features/workspace/hooks/use-editor-tabs";
import {
  useMonacoProblems,
  type ProblemSeverity,
  type WorkspaceProblem,
} from "@/features/workspace/hooks/use-monaco-problems";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { cn } from "@/lib/utils";

type WorkspaceProblemsPanelProps = {
  projectId: string;
};

function SeverityIcon({ severity }: { severity: ProblemSeverity }) {
  if (severity === "error") {
    return <CircleXIcon className="size-3.5 shrink-0 text-ws-danger-soft" />;
  }
  if (severity === "warning") {
    return <CircleAlertIcon className="size-3.5 shrink-0 text-amber-500" />;
  }
  return <InfoIcon className="size-3.5 shrink-0 text-ws-link" />;
}

function groupByFile(problems: WorkspaceProblem[]) {
  const groups = new Map<string, WorkspaceProblem[]>();
  for (const problem of problems) {
    const list = groups.get(problem.path) ?? [];
    list.push(problem);
    groups.set(problem.path, list);
  }
  return [...groups.entries()];
}

export function WorkspaceProblemsPanel({
  projectId,
}: WorkspaceProblemsPanelProps) {
  const { problems } = useMonacoProblems();
  const { openTab } = useEditorTabs(projectId);
  const setPendingEditorReveal = useWorkspaceStore(
    (s) => s.setPendingEditorReveal,
  );

  const onOpenProblem = (problem: WorkspaceProblem) => {
    setPendingEditorReveal({
      path: problem.path,
      line: problem.line,
      column: problem.column,
      matchLength: Math.max(1, problem.endColumn - problem.column),
    });
    openTab({ kind: "file", path: problem.path });
  };

  const groups = groupByFile(problems);

  if (problems.length === 0) {
    return (
      <div className="flex h-full flex-col items-start gap-1 overflow-auto px-3 py-5">
        <p className="text-[12px] font-medium text-ws-text">All clear</p>
        <p className="max-w-sm text-[11px] leading-relaxed text-ws-text-muted">
          Syntax errors and warnings from open editor tabs show up here. Click a
          problem to jump to it.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-auto py-1">
      <ul>
        {groups.map(([path, items]) => (
          <li key={path} className="mb-1">
            <div className="flex items-center gap-2 px-3 py-1 text-[11px]">
              <span className="truncate font-medium text-ws-text">
                {items[0]?.fileName ?? path}
              </span>
              <span className="min-w-0 truncate text-[10px] text-ws-text-muted">
                {path}
              </span>
              <span className="ml-auto shrink-0 tabular-nums text-[10px] text-ws-text-muted">
                {items.length}
              </span>
            </div>
            <ul>
              {items.map((problem) => (
                <li key={problem.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProblem(problem)}
                    className={cn(
                      "flex w-full items-start gap-2 px-3 py-1 text-left text-[11px]",
                      "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                    )}
                  >
                    <SeverityIcon severity={problem.severity} />
                    <span className="min-w-0 flex-1 leading-snug">
                      <span className="text-ws-text">{problem.message}</span>
                      {problem.code ? (
                        <span className="ml-1.5 text-[10px] text-ws-text-muted">
                          ({problem.code})
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 tabular-nums text-[10px] text-ws-text-muted">
                      [{problem.line}, {problem.column}]
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
