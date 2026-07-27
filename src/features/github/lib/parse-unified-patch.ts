/**
 * Reconstruct before/after file content from a GitHub unified diff patch.
 * Includes line-number mapping between the modified editor and head file lines.
 */
export type ParsedUnifiedPatch = {
  original: string;
  modified: string;
  /** 1-based modified editor line → 1-based line in the PR head file */
  modifiedEditorLineToFileLine: Map<number, number>;
  /** 1-based head file line → 1-based modified editor line */
  fileLineToModifiedEditorLine: Map<number, number>;
};

const HUNK_HEADER = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

export function parseUnifiedPatch(patch: string): ParsedUnifiedPatch | null {
  if (!patch.trim()) return null;

  const originalLines: string[] = [];
  const modifiedLines: string[] = [];
  const modifiedEditorLineToFileLine = new Map<number, number>();
  const fileLineToModifiedEditorLine = new Map<number, number>();

  let newFileLine = 1;
  let inHunk = false;

  for (const rawLine of patch.split("\n")) {
    if (rawLine.startsWith("@@")) {
      const match = rawLine.match(HUNK_HEADER);
      if (match) {
        newFileLine = Number.parseInt(match[2]!, 10);
        inHunk = true;
      }
      continue;
    }

    if (
      rawLine.startsWith("diff ") ||
      rawLine.startsWith("index ") ||
      rawLine.startsWith("--- ") ||
      rawLine.startsWith("+++ ")
    ) {
      continue;
    }

    if (!inHunk) continue;

    if (rawLine.startsWith("+")) {
      modifiedLines.push(rawLine.slice(1));
      const editorLine = modifiedLines.length;
      modifiedEditorLineToFileLine.set(editorLine, newFileLine);
      fileLineToModifiedEditorLine.set(newFileLine, editorLine);
      newFileLine += 1;
    } else if (rawLine.startsWith("-")) {
      originalLines.push(rawLine.slice(1));
    } else if (rawLine.startsWith(" ")) {
      const content = rawLine.slice(1);
      originalLines.push(content);
      modifiedLines.push(content);
      const editorLine = modifiedLines.length;
      modifiedEditorLineToFileLine.set(editorLine, newFileLine);
      fileLineToModifiedEditorLine.set(newFileLine, editorLine);
      newFileLine += 1;
    }
  }

  if (originalLines.length === 0 && modifiedLines.length === 0) {
    return null;
  }

  return {
    original: originalLines.join("\n"),
    modified: modifiedLines.join("\n"),
    modifiedEditorLineToFileLine,
    fileLineToModifiedEditorLine,
  };
}

export function diffEditorHeight(lineCount: number, fullPage = false): number {
  const minLines = fullPage ? 12 : 6;
  const maxLines = fullPage ? 48 : 24;
  const lineHeight = fullPage ? 20 : 18;
  const padding = fullPage ? 32 : 24;
  const clamped = Math.min(Math.max(lineCount, minLines), maxLines);
  return clamped * lineHeight + padding;
}

/** Estimate view-zone height for inline comment threads. */
export function commentThreadZoneHeight(
  commentCount: number,
  hasComposer: boolean,
): number {
  const commentBlock = commentCount * 92;
  const composerBlock = hasComposer ? 220 : 0;
  return Math.max(commentBlock + composerBlock + 12, hasComposer ? 220 : 72);
}
