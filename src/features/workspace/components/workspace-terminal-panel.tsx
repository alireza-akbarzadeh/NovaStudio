"use client";

import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { WorkspaceTerminal } from "@/features/workspace/components/workspace-terminal";
import { cn } from "@/lib/utils";

type WorkspaceTerminalPanelProps = {
  projectId: string;
};

type TerminalSession = {
  id: string;
  name: string;
};

type PanelState = {
  sessions: TerminalSession[];
  activeId: string;
  counter: number;
};

function nextSessionId(): string {
  return `term-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function createSession(index: number): TerminalSession {
  return {
    id: nextSessionId(),
    name: index === 1 ? "Terminal" : `Terminal ${index}`,
  };
}

function initialState(): PanelState {
  const first = createSession(1);
  return { sessions: [first], activeId: first.id, counter: 1 };
}

/**
 * VS Code–style multi-terminal host: + to add, tabs to switch, kill to close.
 * Inactive sessions stay mounted so history / cwd survive.
 */
export function WorkspaceTerminalPanel({
  projectId,
}: WorkspaceTerminalPanelProps) {
  const [state, setState] = useState<PanelState>(initialState);
  const { sessions, activeId } = state;
  const activeIdSafe =
    sessions.find((s) => s.id === activeId)?.id ?? sessions[0]?.id ?? "";

  const addSession = useCallback(() => {
    setState((prev) => {
      const nextCounter = prev.counter + 1;
      const session = createSession(nextCounter);
      return {
        sessions: [...prev.sessions, session],
        activeId: session.id,
        counter: nextCounter,
      };
    });
  }, []);

  const killSession = useCallback((id: string) => {
    setState((prev) => {
      if (prev.sessions.length <= 1) {
        const fresh = createSession(1);
        return { sessions: [fresh], activeId: fresh.id, counter: 1 };
      }
      const nextSessions = prev.sessions.filter((s) => s.id !== id);
      const nextActive =
        id === prev.activeId
          ? (nextSessions[nextSessions.length - 1]?.id ?? nextSessions[0]!.id)
          : prev.activeId;
      return {
        ...prev,
        sessions: nextSessions,
        activeId: nextActive,
      };
    });
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-panel">
      <div className="flex h-8 shrink-0 items-center gap-0.5 border-b border-ws-border-subtle px-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {sessions.map((session) => {
            const active = session.id === activeIdSafe;
            return (
              <div
                key={session.id}
                className={cn(
                  "group inline-flex h-6 max-w-36 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-[11px]",
                  active
                    ? "bg-ws-accent/15 text-ws-text shadow-[inset_0_0_0_1px] shadow-ws-accent/30"
                    : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() =>
                    setState((prev) => ({ ...prev, activeId: session.id }))
                  }
                >
                  {session.name}
                </button>
                {sessions.length > 1 ? (
                  <button
                    type="button"
                    title="Kill terminal"
                    aria-label={`Kill ${session.name}`}
                    className={cn(
                      "inline-flex size-4 shrink-0 items-center justify-center rounded text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
                      !active && "opacity-0 group-hover:opacity-100",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      killSession(session.id);
                    }}
                  >
                    <XIcon className="size-2.5" strokeWidth={2} />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="New terminal"
          aria-label="New terminal"
          onClick={addSession}
          className="size-6 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <PlusIcon className="size-3.5" strokeWidth={2} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Kill terminal"
          aria-label="Kill active terminal"
          onClick={() => killSession(activeIdSafe)}
          className="size-6 shrink-0 text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <Trash2Icon className="size-3.5" strokeWidth={1.75} />
        </Button>
      </div>

      <div className="relative min-h-0 flex-1">
        {sessions.map((session) => {
          const active = session.id === activeIdSafe;
          return (
            <div
              key={session.id}
              className={cn(
                "absolute inset-0",
                !active && "pointer-events-none invisible",
              )}
              aria-hidden={!active}
            >
              <WorkspaceTerminal
                projectId={projectId}
                sessionId={session.id}
                active={active}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
