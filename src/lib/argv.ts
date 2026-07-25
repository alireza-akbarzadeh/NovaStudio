/** Parsing helpers for whitespace-separated command lines and their flags. */

/** Split a command line into `command` plus its arguments. */
export function tokenizeCommandLine(input: string): {
  command: string;
  args: string[];
} {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  return { command: parts[0] ?? "", args: parts.slice(1) };
}

/** Remove a matching pair of surrounding single or double quotes. */
export function stripSurroundingQuotes(value: string): string {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));

  return quoted ? trimmed.slice(1, -1).trim() : trimmed;
}

/**
 * Everything after the first matching flag, joined and unquoted.
 * Suits free-text values such as `-m "a commit message"`.
 */
export function readFlagText(
  args: string[],
  flags: readonly string[],
): string | null {
  const index = args.findIndex((arg) => flags.includes(arg));
  if (index === -1) return null;

  const rest = args.slice(index + 1);
  if (rest.length === 0) return null;

  const value = stripSurroundingQuotes(rest.join(" "));
  return value || null;
}

/** Positive integer following the first matching flag, e.g. `-n 20`. */
export function readPositiveIntFlag(
  args: string[],
  flags: readonly string[],
): number | undefined {
  const index = args.findIndex((arg) => flags.includes(arg));
  if (index === -1) return undefined;

  const value = Number(args[index + 1]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
}

/** Count written as a bare flag, e.g. `-5` in `git log -5`. */
export function readCountShorthand(args: string[]): number | undefined {
  const match = args.find((arg) => /^-\d+$/.test(arg));
  return match ? Math.abs(Number(match)) : undefined;
}
