/**
 * Spawn a process inside WebContainer and stream stdout/stderr.
 */

import type { WebContainer } from "@webcontainer/api";

import { toWebContainerCwd } from "@/features/workspace/lib/webcontainer/file-tree";

export type SpawnStreamOptions = {
  cwd?: string;
  /** Called with raw output chunks (may include ANSI / `\n`). */
  onChunk?: (chunk: string) => void;
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
  });

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
  }

  return process.exit;
}
