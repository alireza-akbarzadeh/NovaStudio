import type { EditorTab, EditorTabKind } from "@/features/workspace/store/workspace-store";

export type EditorTabInput =
  | { kind: "welcome" }
  | { kind: "settings" }
  | { kind: "shortcuts" }
  | { kind: "user-json" }
  | { kind: "new-project" }
  | { kind: "file"; path: string }
  | { kind: "diff"; path: string }
  | { kind: "activity-diff"; path: string; activityId: string }
  | { kind: "pull-request"; pullNumber: number };

const SPECIAL_TITLES: Record<
  Exclude<EditorTabKind, "file" | "diff" | "activity-diff" | "pull-request">,
  string
> = {
  welcome: "Welcome",
  settings: "Settings",
  shortcuts: "Shortcuts",
  "user-json": "User JSON",
  "new-project": "New Project",
};

function fileNameFromPath(path: string) {
  const name = path.split("/").filter(Boolean).pop();
  return name || path || "Untitled";
}

export function editorTabId(input: EditorTabInput): string {
  if (input.kind === "file") return `file:${input.path}`;
  if (input.kind === "diff") return `diff:${input.path}`;
  if (input.kind === "activity-diff") return `activity-diff:${input.activityId}`;
  if (input.kind === "pull-request") return `pull-request:${input.pullNumber}`;
  return input.kind;
}

export function editorTabTitle(input: EditorTabInput): string {
  if (input.kind === "file") {
    return fileNameFromPath(input.path);
  }
  if (input.kind === "diff") {
    return `${fileNameFromPath(input.path)} (Diff)`;
  }
  if (input.kind === "activity-diff") {
    return `${fileNameFromPath(input.path)} (Timeline)`;
  }
  if (input.kind === "pull-request") {
    return `PR #${input.pullNumber}`;
  }
  return SPECIAL_TITLES[input.kind];
}

export function createEditorTab(input: EditorTabInput): EditorTab {
  if (input.kind === "file" || input.kind === "diff") {
    return {
      id: editorTabId(input),
      kind: input.kind,
      title: editorTabTitle(input),
      path: input.path,
    };
  }
  if (input.kind === "activity-diff") {
    return {
      id: editorTabId(input),
      kind: input.kind,
      title: editorTabTitle(input),
      path: input.path,
      activityId: input.activityId,
    };
  }
  if (input.kind === "pull-request") {
    return {
      id: editorTabId(input),
      kind: input.kind,
      title: editorTabTitle(input),
      pullNumber: input.pullNumber,
    };
  }
  return {
    id: editorTabId(input),
    kind: input.kind,
    title: editorTabTitle(input),
  };
}

export function editorTabHref(projectId: string, tab: EditorTab): string {
  switch (tab.kind) {
    case "welcome":
      return `/projects/${projectId}`;
    case "settings":
      return `/projects/${projectId}/settings`;
    case "shortcuts":
      return `/projects/${projectId}/shortcuts`;
    case "user-json":
      return `/projects/${projectId}/user-json`;
    case "new-project":
      return `/projects/${projectId}/new`;
    case "file":
      return `/projects/${projectId}/files/${tab.path ?? ""}`;
    case "diff":
      return `/projects/${projectId}/diff/${tab.path ?? ""}`;
    case "activity-diff":
      return `/projects/${projectId}/timeline/${tab.activityId ?? ""}`;
    case "pull-request":
      return `/projects/${projectId}/pull-request/${tab.pullNumber ?? ""}`;
  }
}

/** Parse the active workspace route into an editor tab, or null if unrelated. */
export function editorTabFromPathname(
  projectId: string,
  pathname: string,
): EditorTab | null {
  const base = `/projects/${projectId}`;
  if (pathname === base || pathname === `${base}/`) {
    return createEditorTab({ kind: "welcome" });
  }
  if (pathname === `${base}/settings`) {
    return createEditorTab({ kind: "settings" });
  }
  if (pathname === `${base}/shortcuts`) {
    return createEditorTab({ kind: "shortcuts" });
  }
  if (pathname === `${base}/user-json`) {
    return createEditorTab({ kind: "user-json" });
  }
  if (pathname === `${base}/new`) {
    return createEditorTab({ kind: "new-project" });
  }
  const filesPrefix = `${base}/files/`;
  if (pathname.startsWith(filesPrefix)) {
    const path = decodeURIComponent(pathname.slice(filesPrefix.length));
    if (!path) return createEditorTab({ kind: "welcome" });
    return createEditorTab({ kind: "file", path });
  }
  if (pathname === `${base}/files`) {
    return createEditorTab({ kind: "welcome" });
  }
  const diffPrefix = `${base}/diff/`;
  if (pathname.startsWith(diffPrefix)) {
    const path = decodeURIComponent(pathname.slice(diffPrefix.length));
    if (!path) return createEditorTab({ kind: "welcome" });
    return createEditorTab({ kind: "diff", path });
  }
  if (pathname === `${base}/diff`) {
    return createEditorTab({ kind: "welcome" });
  }
  const timelinePrefix = `${base}/timeline/`;
  if (pathname.startsWith(timelinePrefix)) {
    const activityId = decodeURIComponent(pathname.slice(timelinePrefix.length));
    if (!activityId) return createEditorTab({ kind: "welcome" });
    // Path is filled in by the view once the snapshot loads; tab id is activity-based.
    return createEditorTab({
      kind: "activity-diff",
      path: "…",
      activityId,
    });
  }
  if (pathname === `${base}/timeline`) {
    return createEditorTab({ kind: "welcome" });
  }
  const pullRequestPrefix = `${base}/pull-request/`;
  if (pathname.startsWith(pullRequestPrefix)) {
    const pullNumberRaw = decodeURIComponent(
      pathname.slice(pullRequestPrefix.length).split("/")[0] ?? "",
    );
    const pullNumber = Number.parseInt(pullNumberRaw, 10);
    if (!Number.isFinite(pullNumber) || pullNumber < 1) {
      return createEditorTab({ kind: "welcome" });
    }
    return createEditorTab({ kind: "pull-request", pullNumber });
  }
  return null;
}
