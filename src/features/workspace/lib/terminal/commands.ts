/** Top-level commands available in the simulated shell. */
export const SHELL_COMMANDS = [
  "help",
  "clear",
  "pwd",
  "ls",
  "cat",
  "cd",
  "echo",
  "git",
  "npm",
  "npx",
  "pnpm",
  "yarn",
  "bun",
] as const;

/** Git subcommands supported by the NovaStudio shell. */
export const GIT_SUBCOMMANDS = [
  "status",
  "init",
  "pull",
  "commit",
  "push",
  "branch",
  "checkout",
  "switch",
  "log",
] as const;

export type ShellCommand = (typeof SHELL_COMMANDS)[number];

export type GitSubcommand = (typeof GIT_SUBCOMMANDS)[number];

/** True when the token is a git subcommand the shell implements. */
export function isGitSubcommand(value: string): value is GitSubcommand {
  return (GIT_SUBCOMMANDS as readonly string[]).includes(value);
}
