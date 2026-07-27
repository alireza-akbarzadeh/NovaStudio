/** Line-based three-way merge for GitHub pull integration. */

export type ThreeWayMergeResult =
  | { status: "unchanged"; merged: string }
  | { status: "clean"; merged: string }
  | { status: "conflict" };

function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.split(/\r?\n/);
}

function joinLines(lines: string[]): string {
  return lines.join("\n");
}

type EditOp =
  | { kind: "keep"; line: string }
  | { kind: "insert"; line: string }
  | { kind: "delete" };

/**
 * Myers-style diff is overkill — use a simple LCS edit script from base → target.
 */
function editScript(base: string[], target: string[]): EditOp[] {
  if (base.length === 0) {
    return target.map((line) => ({ kind: "insert" as const, line }));
  }
  if (target.length === 0) {
    return base.map(() => ({ kind: "delete" as const }));
  }

  const n = base.length;
  const m = target.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array(m + 1).fill(0),
  );

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (base[i - 1] === target[j - 1]) {
        dp[i]![j] = (dp[i - 1]?.[j - 1] ?? 0) + 1;
      } else {
        dp[i]![j] = Math.max(dp[i - 1]?.[j] ?? 0, dp[i]?.[j - 1] ?? 0);
      }
    }
  }

  const ops: EditOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && base[i - 1] === target[j - 1]) {
      ops.push({ kind: "keep", line: base[i - 1]! });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || (dp[i]?.[j - 1] ?? 0) >= (dp[i - 1]?.[j] ?? 0))) {
      ops.push({ kind: "insert", line: target[j - 1]! });
      j--;
    } else {
      ops.push({ kind: "delete" });
      i--;
    }
  }

  ops.reverse();
  return ops;
}

function applyEditScript(base: string[], script: EditOp[]): string[] {
  const result: string[] = [];
  let baseIndex = 0;

  for (const op of script) {
    if (op.kind === "keep") {
      result.push(op.line);
      baseIndex++;
    } else if (op.kind === "insert") {
      result.push(op.line);
    } else {
      baseIndex++;
    }
  }

  return result;
}

/**
 * Merge two edit scripts against the same base. Conflicts when both sides
 * edit the same base region differently.
 */
function mergeScripts(
  base: string[],
  localScript: EditOp[],
  remoteScript: EditOp[],
): string[] | null {
  type Side = "local" | "remote" | "both";

  let bi = 0;
  let li = 0;
  let ri = 0;
  const out: string[] = [];

  const nextLocal = () => localScript[li];
  const nextRemote = () => remoteScript[ri];

  while (li < localScript.length || ri < remoteScript.length) {
    const lop = nextLocal();
    const rop = nextRemote();

    if (lop?.kind === "keep" && rop?.kind === "keep") {
      if (lop.line !== rop.line) return null;
      out.push(lop.line);
      bi++;
      li++;
      ri++;
      continue;
    }

    if (lop?.kind === "keep" && !rop) {
      out.push(lop.line);
      bi++;
      li++;
      continue;
    }
    if (rop?.kind === "keep" && !lop) {
      out.push(rop.line);
      bi++;
      ri++;
      continue;
    }

    if (lop?.kind === "keep" && rop && rop.kind !== "keep") {
      // remote edited; include remote ops until realigned
      if (rop.kind === "insert") {
        out.push(rop.line);
        ri++;
        continue;
      }
      // remote delete — skip base line
      bi++;
      ri++;
      continue;
    }

    if (rop?.kind === "keep" && lop && lop.kind !== "keep") {
      if (lop.kind === "insert") {
        out.push(lop.line);
        li++;
        continue;
      }
      bi++;
      li++;
      continue;
    }

    // Both sides have non-keep ops at the same base position.
    const localChunk: EditOp[] = [];
    const remoteChunk: EditOp[] = [];

    while (li < localScript.length && localScript[li]?.kind !== "keep") {
      localChunk.push(localScript[li]!);
      li++;
    }
    while (ri < remoteScript.length && remoteScript[ri]?.kind !== "keep") {
      remoteChunk.push(remoteScript[ri]!);
      ri++;
    }

    const localText = localChunk
      .filter((op) => op.kind === "insert")
      .map((op) => (op as { kind: "insert"; line: string }).line)
      .join("\n");
    const remoteText = remoteChunk
      .filter((op) => op.kind === "insert")
      .map((op) => (op as { kind: "insert"; line: string }).line)
      .join("\n");

    if (localText === remoteText) {
      for (const op of localChunk) {
        if (op.kind === "insert") out.push(op.line);
      }
      continue;
    }

    // Non-overlapping inserts at same delete point — accept both (local first).
    const localOnlyDeletes =
      localChunk.every((op) => op.kind === "delete") && localChunk.length > 0;
    const remoteOnlyDeletes =
      remoteChunk.every((op) => op.kind === "delete") && remoteChunk.length > 0;

    if (localOnlyDeletes && remoteChunk.some((op) => op.kind === "insert")) {
      for (const op of remoteChunk) {
        if (op.kind === "insert") out.push(op.line);
      }
      continue;
    }
    if (remoteOnlyDeletes && localChunk.some((op) => op.kind === "insert")) {
      for (const op of localChunk) {
        if (op.kind === "insert") out.push(op.line);
      }
      continue;
    }

    // Overlapping edits — try concatenating inserts if disjoint text.
    if (
      localChunk.every((op) => op.kind !== "delete") &&
      remoteChunk.every((op) => op.kind !== "delete") &&
      localText &&
      remoteText &&
      !localText.includes(remoteText) &&
      !remoteText.includes(localText)
    ) {
      for (const op of localChunk) {
        if (op.kind === "insert") out.push(op.line);
      }
      for (const op of remoteChunk) {
        if (op.kind === "insert") out.push(op.line);
      }
      continue;
    }

    return null;
  }

  return out;
}

export function threeWayMerge(
  base: string,
  local: string,
  remote: string,
): ThreeWayMergeResult {
  if (local === remote) {
    return {
      status: local === base ? "unchanged" : "clean",
      merged: local,
    };
  }
  if (local === base) {
    return { status: "clean", merged: remote };
  }
  if (remote === base) {
    return { status: "clean", merged: local };
  }

  const baseLines = splitLines(base);
  const localLines = splitLines(local);
  const remoteLines = splitLines(remote);

  // Cap work for huge generated files — treat as conflict.
  if (
    baseLines.length * localLines.length > 4_000_000 ||
    baseLines.length * remoteLines.length > 4_000_000
  ) {
    return { status: "conflict" };
  }

  const localScript = editScript(baseLines, localLines);
  const remoteScript = editScript(baseLines, remoteLines);
  const mergedLines = mergeScripts(baseLines, localScript, remoteScript);

  if (mergedLines === null) {
    return { status: "conflict" };
  }

  const merged = joinLines(mergedLines);
  if (merged === base) {
    return { status: "unchanged", merged };
  }
  return { status: "clean", merged };
}

/** Join non-overlapping local + remote edits (best-effort "accept both"). */
export function mergeBothSides(
  base: string,
  local: string,
  remote: string,
): string {
  const baseLines = splitLines(base);
  const localScript = editScript(baseLines, splitLines(local));
  const remoteScript = editScript(baseLines, splitLines(remote));
  const merged = mergeScripts(baseLines, localScript, remoteScript);
  if (merged !== null) {
    return joinLines(merged);
  }

  const parts = [splitLines(local), splitLines(remote)];
  const seen = new Set<string>();
  const combined: string[] = [];
  for (const lines of parts) {
    for (const line of lines) {
      if (!seen.has(line)) {
        seen.add(line);
        combined.push(line);
      }
    }
  }
  return joinLines(combined);
}
