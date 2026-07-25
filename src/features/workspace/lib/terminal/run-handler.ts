import type { ShellResult } from "@/features/workspace/lib/terminal/types";

function isCancellation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "ActionCancelledError" || error.message === "Cancelled")
  );
}

/**
 * Invoke an optional async shell handler and map it to a `ShellResult`.
 * A dismissed confirmation dialog exits 130, like Ctrl+C in a real shell.
 */
export async function runHandler(
  run: (() => Promise<string>) | undefined,
  unavailable: string,
): Promise<ShellResult> {
  if (!run) {
    return { output: unavailable, exitCode: 1 };
  }

  try {
    return { output: await run(), exitCode: 0 };
  } catch (error) {
    if (isCancellation(error)) {
      return { output: "Aborted.", exitCode: 130 };
    }

    return {
      output:
        error instanceof Error
          ? `error: ${error.message}`
          : "error: command failed",
      exitCode: 1,
    };
  }
}
