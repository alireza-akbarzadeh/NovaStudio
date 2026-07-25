/**
 * Entry point for the simulated workspace terminal.
 * Parses a command line and routes it to the matching command module.
 */

import { tokenizeCommandLine } from "@/lib/argv";
import { resolveAbsolutePath } from "@/lib/posix-path";
import { handleGitCommand } from "@/features/workspace/lib/terminal/git-command";
import { HELP_TEXT } from "@/features/workspace/lib/terminal/help-text";
import { handlePackageManagerCommand } from "@/features/workspace/lib/terminal/package-manager-command";
import { isNodeCliCommand } from "@/features/workspace/lib/terminal/package-scripts";
import {
  directoryExists,
  listDirectory,
  readFile,
} from "@/features/workspace/lib/terminal/virtual-fs";
import type {
  ShellContext,
  ShellHandlers,
  ShellResult,
} from "@/features/workspace/lib/terminal/types";

export type {
  ShellContext,
  ShellFile,
  ShellHandlers,
  ShellProject,
  ShellResult,
} from "@/features/workspace/lib/terminal/types";

/** Sentinel output telling the terminal to reset its buffer. */
export const CLEAR_SCREEN = "__CLEAR__";

function catCommand(args: string[], context: ShellContext): ShellResult {
  const cwd = context.cwd;
  const target = args[0];

  if (!target) {
    return { output: "cat: missing file operand", exitCode: 1, cwd };
  }

  const result = readFile(context.files, cwd, target);
  return result.ok
    ? { output: result.content, exitCode: 0, cwd }
    : { output: result.message, exitCode: 1, cwd };
}

function cdCommand(args: string[], context: ShellContext): ShellResult {
  const cwd = context.cwd;
  const target = args[0];

  if (!target) {
    return { output: cwd, exitCode: 0, cwd: "/" };
  }

  const next = resolveAbsolutePath(target, cwd);
  if (!directoryExists(context.files, next)) {
    return { output: `cd: ${target}: No such directory`, exitCode: 1, cwd };
  }

  return { output: "", exitCode: 0, cwd: next };
}

export async function runShellCommand(
  input: string,
  context: ShellContext,
  handlers: ShellHandlers = {},
): Promise<ShellResult> {
  const { command, args } = tokenizeCommandLine(input);
  const cwd = context.cwd;

  if (!command) {
    return { output: "", exitCode: 0, cwd };
  }

  if (isNodeCliCommand(command)) {
    return handlePackageManagerCommand(command, args, context, handlers);
  }

  switch (command) {
    case "help":
      return { output: HELP_TEXT, exitCode: 0, cwd };
    case "clear":
      return { output: CLEAR_SCREEN, exitCode: 0, cwd };
    case "pwd":
      return { output: cwd, exitCode: 0, cwd };
    case "ls":
      return {
        output: listDirectory(context.files, cwd, args[0] ?? "."),
        exitCode: 0,
        cwd,
      };
    case "cat":
      return catCommand(args, context);
    case "cd":
      return cdCommand(args, context);
    case "echo":
      return { output: args.join(" "), exitCode: 0, cwd };
    case "git":
      return handleGitCommand(args, context, handlers);
    default:
      return {
        output: `${command}: command not found. Type 'help' for available commands.`,
        exitCode: 127,
        cwd,
      };
  }
}
