import type { Terminal } from "@xterm/xterm";

type PromptOptions = {
  projectName: string;
  cwd: string;
  /** Active git branch, when known. */
  branch?: string | null;
  /** True when the working tree has local changes. */
  dirty?: boolean;
  isDark: boolean;
  /** When true, start on a new line (after output). Default false for redraws. */
  newline?: boolean;
};

const RESET = "\x1b[0m";
const DIM = "\x1b[90m";

function directoryLabel(projectName: string, cwd: string) {
  if (cwd === "/" || cwd === "") return projectName;
  const segments = cwd.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? projectName;
}

function stripAnsi(text: string) {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * Starship-style prompt using ASCII-safe markers so cell widths stay even.
 * Example: `at novastudio on main *`
 */
export function formatShellPrompt(options: PromptOptions): {
  text: string;
  /** Visible cell count of the prompt (excl. leading newline). */
  cols: number;
} {
  const {
    projectName,
    cwd,
    branch,
    dirty = false,
    isDark,
    newline = false,
  } = options;

  const dirColor = isDark ? "\x1b[94m" : "\x1b[34m";
  const branchColor = isDark ? "\x1b[36m" : "\x1b[36m";
  const dirtyColor = isDark ? "\x1b[33m" : "\x1b[33m";

  const label = directoryLabel(projectName, cwd);
  const lead = newline ? "\r\n" : "";

  let body = `${DIM}at${RESET} ${dirColor}${label}${RESET}`;

  if (branch) {
    body += ` ${DIM}on${RESET} ${branchColor}${branch}${RESET}`;
    if (dirty) {
      body += ` ${dirtyColor}*${RESET}`;
    }
  }

  body += " ";
  return { text: `${lead}${body}`, cols: stripAnsi(body).length };
}

/**
 * Write the shell prompt. Returns visible column width (for input layout).
 */
export function writeShellPrompt(
  term: Terminal,
  options: PromptOptions,
): number {
  const { text, cols } = formatShellPrompt(options);
  term.write(text);
  return cols;
}
