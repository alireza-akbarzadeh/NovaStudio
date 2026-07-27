"use client";

import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { WorkspaceTerminal } from "@/features/workspace/components/workspace-terminal";
import {
  getSessionPalette,
  getSessionTabStyles,
  TERMINAL_SESSION_PALETTE,
} from "@/features/workspace/lib/terminal/session-colors";
import {
  loadTerminalPanelState,
  saveTerminalPanelState,
  type TerminalPanelState,
  type TerminalSession,
} from "@/features/workspace/lib/terminal/terminal-sessions";
import { cn } from "@/lib/utils";

type WorkspaceTerminalPanelProps = {
  projectId: string;
};

type PanelState = TerminalPanelState;

function nextSessionId(): string {
  return `term-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Prefer an unused palette slot so each open tab stays visually distinct. */
function nextColorIndex(sessions: TerminalSession[]): number {
  const used = new Set(sessions.map((session) => session.colorIndex));
  for (let i = 0; i < TERMINAL_SESSION_PALETTE.length; i++) {
    if (!used.has(i)) return i;
  }
  return sessions.length % TERMINAL_SESSION_PALETTE.length;
}

function createSession(index: number, colorIndex: number): TerminalSession {
  return {
    id: nextSessionId(),
    name: index === 1 ? "Terminal" : `Terminal ${index}`,
    colorIndex,
  };
}

function initialState(): PanelState {
  const first = createSession(1, 0);
  return { sessions: [first], activeId: first.id, counter: 1 };
}

function normalizeSessionName(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 48) : fallback;
}

function reorderSessions(
  sessions: TerminalSession[],
  fromId: string,
  toId: string,
): TerminalSession[] {
  const fromIndex = sessions.findIndex((session) => session.id === fromId);
  const toIndex = sessions.findIndex((session) => session.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return sessions;
  const next = [...sessions];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return sessions;
  next.splice(toIndex, 0, moved);
  return next;
}

type TerminalTabProps = {
  session: TerminalSession;
  active: boolean;
  canClose: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
};

function TerminalTab({
  session,
  active,
  canClose,
  isDragging,
  isDropTarget,
  onSelect,
  onClose,
  onRename,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
}: TerminalTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setDraft(session.name);
    }
  }, [session.name, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = () => {
    onRename(normalizeSessionName(draft, session.name));
    setEditing(false);
  };

  const cancelRename = () => {
    setDraft(session.name);
    setEditing(false);
  };

  const tabStyle = getSessionTabStyles(session.colorIndex, active);
  const accent = getSessionPalette(session.colorIndex).accent;

  return (
    <div
      role="tab"
      aria-selected={active}
      draggable={!editing}
      onDragStart={(event) => {
        if (editing) {
          event.preventDefault();
          return;
        }
        onDragStart(event);
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={cn(
        "group relative inline-flex h-6 max-w-44 shrink-0 cursor-grab items-center gap-1 rounded-md px-1.5 text-[11px] transition-colors active:cursor-grabbing",
        !active && "hover:bg-ws-hover/60",
        isDragging && "opacity-50",
        isDropTarget &&
          "before:absolute before:inset-y-0.5 before:left-0 before:z-10 before:w-0.5 before:rounded-full before:bg-ws-accent",
      )}
      style={tabStyle}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              event.preventDefault();
              commitRename();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              cancelRename();
            }
          }}
          onBlur={commitRename}
          onMouseDown={(event) => event.stopPropagation()}
          className="min-w-0 flex-1 truncate rounded-sm bg-ws-bg/80 px-1 py-0 text-[11px] text-ws-text outline-none ring-1 ring-ws-accent/40"
          aria-label="Rename terminal session"
        />
      ) : (
        <button
          type="button"
          className="min-w-0 flex-1 cursor-grab truncate text-left active:cursor-grabbing"
          title={`${session.name} — double-click to rename · drag to reorder`}
          onClick={onSelect}
          onDoubleClick={(event) => {
            event.preventDefault();
            setEditing(true);
          }}
        >
          {session.name}
        </button>
      )}

      {canClose ? (
        <button
          type="button"
          title="Kill terminal"
          aria-label={`Kill ${session.name}`}
          draggable={false}
          className={cn(
            "inline-flex size-4 shrink-0 items-center justify-center rounded text-current/70 hover:bg-black/10 hover:text-current dark:hover:bg-white/10",
            !active && "opacity-0 group-hover:opacity-100",
          )}
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <XIcon className="size-2.5" strokeWidth={2} />
        </button>
      ) : null}
    </div>
  );
}

/**
 * VS Code–style multi-terminal host: + to add, tabs to switch, kill to close.
 * Tabs are renameable (double-click), reorderable (drag), and tinted uniquely.
 * Inactive sessions stay mounted so history / cwd survive.
 */
export function WorkspaceTerminalPanel({
  projectId,
}: WorkspaceTerminalPanelProps) {
  const skipSaveRef = useRef(true);

  const [state, setState] = useState<PanelState>(() => {
    if (typeof window === "undefined") return initialState();
    return loadTerminalPanelState(projectId) ?? initialState();
  });

  useEffect(() => {
    skipSaveRef.current = true;
    setState(loadTerminalPanelState(projectId) ?? initialState());
  }, [projectId]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    saveTerminalPanelState(projectId, state);
  }, [projectId, state]);

  const { sessions, activeId } = state;
  const activeIdSafe =
    sessions.find((s) => s.id === activeId)?.id ?? sessions[0]?.id ?? "";

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dragIdRef = useRef<string | null>(null);

  const addSession = useCallback(() => {
    setState((prev) => {
      const nextCounter = prev.counter + 1;
      const session = createSession(nextCounter, nextColorIndex(prev.sessions));
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
        const fresh = createSession(1, 0);
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

  const renameSession = useCallback((id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === id ? { ...session, name } : session,
      ),
    }));
  }, []);

  const reorderSession = useCallback((fromId: string, toId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: reorderSessions(prev.sessions, fromId, toId),
    }));
  }, []);

  const onTabDragStart = useCallback(
    (event: DragEvent<HTMLDivElement>, tabId: string) => {
      dragIdRef.current = tabId;
      setDraggingId(tabId);
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", tabId);
    },
    [],
  );

  const onTabDragEnd = useCallback(() => {
    dragIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
  }, []);

  const onTabDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>, tabId: string) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (dragIdRef.current && dragIdRef.current !== tabId) {
        setDropTargetId(tabId);
      }
    },
    [],
  );

  const onTabDrop = useCallback(
    (event: DragEvent<HTMLDivElement>, toId: string) => {
      event.preventDefault();
      const fromId =
        dragIdRef.current ?? event.dataTransfer.getData("text/plain");
      if (fromId && fromId !== toId) {
        reorderSession(fromId, toId);
      }
      onTabDragEnd();
    },
    [onTabDragEnd, reorderSession],
  );

  const { resolvedTheme } = useTheme();
  const isDark = (resolvedTheme ?? "dark") === "dark";

  return (
    <div className="flex h-full min-h-0 flex-col bg-ws-panel">
      <div className="flex h-8 shrink-0 items-center gap-0.5 border-b border-ws-border-subtle px-1.5">
        <div
          role="tablist"
          aria-label="Terminal sessions"
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
        >
          {sessions.map((session) => (
            <TerminalTab
              key={session.id}
              session={session}
              active={session.id === activeIdSafe}
              canClose={sessions.length > 1}
              isDragging={draggingId === session.id}
              isDropTarget={
                dropTargetId === session.id && draggingId !== session.id
              }
              onSelect={() =>
                setState((prev) => ({ ...prev, activeId: session.id }))
              }
              onClose={() => killSession(session.id)}
              onRename={(name) => renameSession(session.id, name)}
              onDragStart={(event) => onTabDragStart(event, session.id)}
              onDragEnd={onTabDragEnd}
              onDragOver={(event) => onTabDragOver(event, session.id)}
              onDrop={(event) => onTabDrop(event, session.id)}
              onDragLeave={() => {
                if (dropTargetId === session.id) setDropTargetId(null);
              }}
            />
          ))}
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
                sessionName={session.name}
                colorIndex={session.colorIndex}
                active={active}
                isDark={isDark}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
