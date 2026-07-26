/** `git …` subcommands, backed by the GitHub API through shell handlers. */

import {
  readCountShorthand,
  readFlagText,
  readPositiveIntFlag,
} from "@/lib/argv";
import {
  isGitSubcommand,
  type GitSubcommand,
} from "@/features/workspace/lib/terminal/commands";
import { runHandler } from "@/features/workspace/lib/terminal/run-handler";
import type {
  ShellContext,
  ShellHandlers,
  ShellResult,
} from "@/features/workspace/lib/terminal/types";

type GitCommandInput = {
  /** Subcommand as typed, so `checkout` and `switch` can differ in wording. */
  name: GitSubcommand;
  /** Arguments after the subcommand. */
  args: string[];
  context: ShellContext;
  handlers: ShellHandlers;
};

type GitSubcommandSpec = {
  /** Guard the command behind a linked GitHub repository. */
  requiresRepo?: boolean;
  run: (input: GitCommandInput) => Promise<ShellResult> | ShellResult;
};

export function gitStatus(context: ShellContext): string {
  if (!context.project.githubRepoUrl) {
    return [
      "On branch (not initialized)",
      "",
      "This project is not linked to a GitHub repository.",
      "Run `git init` to create one.",
    ].join("\n");
  }

  const branch = context.project.githubBranch ?? "main";
  const lines = [
    `On branch ${branch}`,
    `Repository: ${context.project.githubRepoUrl}`,
  ];

  if (context.changedPaths.size === 0) {
    lines.push("", "nothing to commit, working tree clean");
    return lines.join("\n");
  }

  lines.push("", "Changes not staged for commit:");
  for (const path of [...context.changedPaths].sort()) {
    lines.push(`  modified: ${path}`);
  }
  lines.push(
    "",
    'Use `git commit -m "your message"` to commit and push these changes.',
  );

  return lines.join("\n");
}

function requireLinkedRepo(context: ShellContext): string | null {
  if (!context.project.githubRepoUrl || context.project.source !== "github") {
    return "fatal: not a linked GitHub repository. Run `git init` or clone from GitHub first.";
  }
  return null;
}

/** Message from `git commit -m "msg"` / `-am msg`. */
export function parseCommitMessage(args: string[]): string | null {
  return readFlagText(args, ["-m", "-am"]);
}

/** Commit count from `git log -n 20` / `--max-count 20` / `-20`. */
export function parseLogLimit(args: string[]): number | undefined {
  return (
    readPositiveIntFlag(args, ["-n", "--max-count"]) ?? readCountShorthand(args)
  );
}

/** Branch name, ignoring the `-b` / `-c` create flags. */
function parseBranchName(args: string[]): string | undefined {
  return args.find(
    (arg) => arg !== "-b" && arg !== "-c" && !arg.startsWith("-"),
  );
}

const SUBCOMMANDS: Record<GitSubcommand, GitSubcommandSpec> = {
  status: {
    run: ({ context }) => ({ output: gitStatus(context), exitCode: 0 }),
  },

  init: {
    run: ({ args, context, handlers }) => {
      if (context.project.githubRepoUrl) {
        return { output: "fatal: repository already initialized", exitCode: 1 };
      }

      const repoName = args[0];
      if (!repoName) {
        handlers.onOpenGitInitDialog?.();
        return handlers.onOpenGitInitDialog
          ? { output: "Opening repository initialization dialog…", exitCode: 0 }
          : {
              output:
                "fatal: repository name required. Use `git init <name>`.",
              exitCode: 1,
            };
      }

      return runHandler(
        handlers.onGitInit ? () => handlers.onGitInit!(repoName) : undefined,
        "git init is unavailable in this session",
      );
    },
  },

  pull: {
    requiresRepo: true,
    run: ({ handlers }) =>
      runHandler(handlers.onGitPull, "git pull is unavailable in this session"),
  },

  commit: { requiresRepo: true, run: commitAndPush },
  push: { requiresRepo: true, run: commitAndPush },

  branch: {
    requiresRepo: true,
    run: ({ handlers }) =>
      runHandler(
        handlers.onGitBranchList,
        "git branch is unavailable in this session",
      ),
  },

  checkout: { requiresRepo: true, run: checkoutOrSwitch },
  switch: { requiresRepo: true, run: checkoutOrSwitch },

  log: {
    requiresRepo: true,
    run: ({ args, handlers }) => {
      const limit = parseLogLimit(args);
      return runHandler(
        handlers.onGitLog ? () => handlers.onGitLog!(limit) : undefined,
        "git log is unavailable in this session",
      );
    },
  },
};

/** NovaStudio combines commit + push, so both spellings share one flow. */
function commitAndPush({
  name,
  args,
  context,
  handlers,
}: GitCommandInput): Promise<ShellResult> | ShellResult {
  const message = parseCommitMessage(args);
  if (!message) {
    return {
      output:
        name === "push"
          ? 'usage: git push -m "commit message"\n(NovaStudio combines commit + push)'
          : 'usage: git commit -m "commit message"',
      exitCode: 1,
    };
  }

  if (context.changedPaths.size === 0) {
    return { output: "nothing to commit, working tree clean", exitCode: 0 };
  }

  return runHandler(
    handlers.onGitCommitPush
      ? () => handlers.onGitCommitPush!(message)
      : undefined,
    "git commit/push is unavailable in this session",
  );
}

function checkoutOrSwitch({
  name,
  args,
  handlers,
}: GitCommandInput): Promise<ShellResult> | ShellResult {
  const branch = parseBranchName(args);
  if (!branch) {
    return {
      output:
        name === "switch"
          ? "usage: git switch <branch> | git switch -c <name>"
          : "usage: git checkout <branch> | git checkout -b <name>",
      exitCode: 1,
    };
  }

  if (args.includes("-b") || args.includes("-c")) {
    return runHandler(
      handlers.onGitCreateBranch
        ? () => handlers.onGitCreateBranch!(branch)
        : undefined,
      "git checkout -b is unavailable in this session",
    );
  }

  return runHandler(
    handlers.onGitCheckout ? () => handlers.onGitCheckout!(branch) : undefined,
    "git checkout is unavailable in this session",
  );
}

export async function handleGitCommand(
  args: string[],
  context: ShellContext,
  handlers: ShellHandlers,
): Promise<ShellResult> {
  const withCwd = (result: ShellResult): ShellResult => ({
    ...result,
    cwd: context.cwd,
  });

  const name = args[0] || "status";
  if (!isGitSubcommand(name)) {
    return withCwd({
      output: `git: '${name}' is not supported. Type 'help' for available git commands.`,
      exitCode: 1,
    });
  }

  const spec = SUBCOMMANDS[name];

  if (spec.requiresRepo) {
    const error = requireLinkedRepo(context);
    if (error) return withCwd({ output: error, exitCode: 1 });
  }

  return withCwd(
    await spec.run({ name, args: args.slice(1), context, handlers }),
  );
}
