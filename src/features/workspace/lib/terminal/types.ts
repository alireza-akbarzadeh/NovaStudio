import type { Doc } from "@/convex/_generated/dataModel";

export type ShellProject = {
  name: string;
  source?: "blank" | "github" | "template";
  templateId?: "empty" | "simple" | "nextjs" | "react" | "tanstack";
  githubRepoUrl?: string;
  githubBranch?: string;
  lastCommitSha?: string;
  syncedAt?: number;
};

export type ShellFile = Pick<
  Doc<"projectFiles">,
  "path" | "name" | "kind" | "content"
>;

export type ShellContext = {
  project: ShellProject;
  files: ShellFile[];
  changedPaths: Set<string>;
  cwd: string;
};

export type ShellHandlers = {
  onGitInit?: (repoName: string) => Promise<string>;
  onOpenGitInitDialog?: () => void;
  onGitPull?: () => Promise<string>;
  onGitCommitPush?: (message: string) => Promise<string>;
  onGitBranchList?: () => Promise<string>;
  onGitCheckout?: (branch: string) => Promise<string>;
  onGitCreateBranch?: (name: string) => Promise<string>;
  onGitLog?: (limit?: number) => Promise<string>;
};

export type ShellResult = {
  output: string;
  exitCode: number;
  cwd?: string;
};
