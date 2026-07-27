/**
 * Spawn a process inside WebContainer and stream stdout/stderr.
 * Supports piping terminal keystrokes into process stdin (interactive prompts).
 */

import type { WebContainer } from "@webcontainer/api";

import { toWebContainerCwd } from "@/features/workspace/lib/webcontainer/file-tree";

export type SpawnStreamOptions = {
  cwd?: string;
  cols?: number;
  rows?: number;
  env?: Record<string, string | number | boolean>;
  /** Called with raw output chunks (may include ANSI / `\n`). */
  onChunk?: (chunk: string) => void;
  /**
   * Called once the process stdin writer is ready.
   * Invoke `write(data)` for each keystroke; call stops when the process ends.
   */
  onStdin?: (write: (data: string) => void) => void;
  /** Called when stdin should no longer be used (process exiting). */
  onStdinEnd?: () => void;
  signal?: AbortSignal;
};

/**
 * Run `command args…` in the WebContainer and return the exit code.
 * Output is streamed via `onChunk` (already decoded as text).
 */
export async function spawnAndStream(
  wc: WebContainer,
  command: string,
  args: string[],
  options: SpawnStreamOptions = {},
): Promise<number> {
  const cwd = options.cwd ? toWebContainerCwd(options.cwd) : undefined;

  const process = await wc.spawn(command, args, {
    cwd: cwd && cwd !== "." ? cwd : undefined,
    env: options.env,
    terminal: {
      cols: options.cols ?? 80,
      rows: options.rows ?? 24,
    },
  });

  const inputWriter = process.input.getWriter();
  let stdinOpen = true;

  const writeStdin = (data: string) => {
    if (!stdinOpen) return;
    void inputWriter.write(data).catch(() => {
      // Process may have closed stdin.
    });
  };

  options.onStdin?.(writeStdin);

  const reader = process.output.getReader();

  const abort = () => {
    void process.kill();
  };
  options.signal?.addEventListener("abort", abort, { once: true });

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && options.onChunk) {
        options.onChunk(value);
      }
    }
  } finally {
    options.signal?.removeEventListener("abort", abort);
    reader.releaseLock();
    stdinOpen = false;
    options.onStdinEnd?.();
    try {
      inputWriter.releaseLock();
    } catch {
      // already released
    }
  }

  return process.exit;
}
