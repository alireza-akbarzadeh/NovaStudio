/**
 * Reconstruct before/after file content from a GitHub unified diff patch.
 * Returns null when the patch cannot be parsed into meaningful content.
 */
export function parseUnifiedPatch(patch: string): {
  original: string;
  modified: string;
} | null {
  if (!patch.trim()) return null;

  const originalLines: string[] = [];
  const modifiedLines: string[] = [];

  for (const rawLine of patch.split("\n")) {
    if (
      rawLine.startsWith("diff ") ||
      rawLine.startsWith("index ") ||
      rawLine.startsWith("--- ") ||
      rawLine.startsWith("+++ ") ||
      rawLine.startsWith("@@")
    ) {
      continue;
    }

    if (rawLine.startsWith("+")) {
      modifiedLines.push(rawLine.slice(1));
    } else if (rawLine.startsWith("-")) {
      originalLines.push(rawLine.slice(1));
    } else if (rawLine.startsWith(" ")) {
      const content = rawLine.slice(1);
      originalLines.push(content);
      modifiedLines.push(content);
    }
  }

  if (originalLines.length === 0 && modifiedLines.length === 0) {
    return null;
  }

  return {
    original: originalLines.join("\n"),
    modified: modifiedLines.join("\n"),
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
