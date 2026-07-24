/** Line-level added/removed counts for Git change chrome. */

const DIFF_LINE_CAP = 4_000;

function splitLines(text: string): string[] {
  if (text === "") return [];
  return text.split(/\r?\n/);
}

/**
 * Longest common subsequence length for two string arrays.
 * Caps work for very large files — falls back to coarse line-count delta.
 */
function lcsLength(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return 0;

  // Rolling two-row DP to keep memory small.
  let prev = new Uint32Array(m + 1);
  let curr = new Uint32Array(m + 1);

  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) {
      if (ai === b[j - 1]) {
        curr[j] = (prev[j - 1] ?? 0) + 1;
      } else {
        const left = curr[j - 1] ?? 0;
        const up = prev[j] ?? 0;
        curr[j] = left > up ? left : up;
      }
    }
    const swap = prev;
    prev = curr;
    curr = swap;
    curr.fill(0);
  }

  return prev[m] ?? 0;
}

export type LineDiffStats = {
  added: number;
  removed: number;
};

/**
 * Count inserted / deleted lines between two file versions
 * (same idea as GitHub’s green/red numbers).
 */
export function countLineDiffStats(
  original: string,
  modified: string,
): LineDiffStats {
  if (original === modified) {
    return { added: 0, removed: 0 };
  }

  const a = splitLines(original);
  const b = splitLines(modified);

  if (a.length === 0) {
    return { added: b.length, removed: 0 };
  }
  if (b.length === 0) {
    return { added: 0, removed: a.length };
  }

  // Avoid O(n·m) blow-ups on huge generated files.
  if (a.length * b.length > DIFF_LINE_CAP * DIFF_LINE_CAP) {
    const added = Math.max(0, b.length - a.length);
    const removed = Math.max(0, a.length - b.length);
    // When lengths match but content differs, approximate as replace.
    if (added === 0 && removed === 0) {
      return { added: b.length, removed: a.length };
    }
    return { added, removed };
  }

  const common = lcsLength(a, b);
  return {
    added: b.length - common,
    removed: a.length - common,
  };
}
