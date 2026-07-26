"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangleIcon, FileCodeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type EditorErrorBoundaryProps = {
  filePath?: string;
  children: ReactNode;
  /** Optional plaintext fallback when the rich editor crashes. */
  fallbackContent?: string;
};

type EditorErrorBoundaryState = {
  error: Error | null;
};

function formatUnknownError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("The editor hit an unexpected error");
  }
}

/**
 * Keeps a single file tab alive when Monaco / Liveblocks / language packs throw.
 * Without this, unsupported languages (or bad worker setups) blank the whole app.
 */
export class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): EditorErrorBoundaryState {
    return { error: formatUnknownError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[editor]", formatUnknownError(error).message, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const name = this.props.filePath?.split("/").pop() ?? "this file";

    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 bg-ws-stage px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border border-ws-border-subtle bg-ws-panel text-ws-warning">
          <AlertTriangleIcon className="size-6" />
        </div>
        <div className="max-w-md space-y-2">
          <p className="text-sm font-medium text-ws-text">
            Couldn&apos;t open the editor for {name}
          </p>
          <p className="text-[12px] leading-relaxed text-ws-text-muted">
            This language or project setup isn&apos;t fully supported yet. You can
            retry, or keep editing in a plain-text view while we expand language
            support.
          </p>
          {error.message ? (
            <p className="rounded-lg border border-ws-border-subtle bg-ws-panel/80 px-3 py-2 font-mono text-[11px] text-ws-text-secondary">
              {error.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" size="sm" className="rounded-xl" onClick={this.reset}>
            Try again
          </Button>
        </div>
        {this.props.fallbackContent != null ? (
          <div className="mt-2 w-full max-w-3xl overflow-hidden rounded-xl border border-ws-border-subtle bg-ws-panel text-left">
            <div className="flex items-center gap-2 border-b border-ws-border-subtle px-3 py-2 text-[11px] text-ws-text-muted">
              <FileCodeIcon className="size-3.5" />
              Plain-text preview
            </div>
            <pre className="max-h-80 overflow-auto p-3 font-mono text-[12px] leading-relaxed text-ws-text-secondary whitespace-pre-wrap">
              {this.props.fallbackContent}
            </pre>
          </div>
        ) : null}
      </div>
    );
  }
}
