import { spawn } from "node:child_process";

export type SpawnResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

export async function spawnCommand(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs?: number;
  } = {},
): Promise<SpawnResult> {
  const timeoutMs = options.timeoutMs ?? 8 * 60 * 1000;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill("SIGTERM");
      reject(new Error(`Command timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

export function resolveCursorCliBinary(): string {
  return process.env.CURSOR_CLI_BINARY?.trim() || "agent";
}

export function resolveOpenClawBinary(): string {
  return process.env.OPENCLAW_CLI_BINARY?.trim() || "openclaw";
}
