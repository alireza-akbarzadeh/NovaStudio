import { TERMINAL_SESSION_PALETTE } from "@/features/workspace/lib/terminal/session-colors";

export type TerminalSession = {
  id: string;
  name: string;
  colorIndex: number;
};

export type TerminalPanelState = {
  sessions: TerminalSession[];
  activeId: string;
  counter: number;
};

const STORAGE_PREFIX = "polaris-terminal-sessions:";

function storageKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

function isTerminalSession(value: unknown): value is TerminalSession {
  if (!value || typeof value !== "object") return false;
  const row = value as TerminalSession;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    typeof row.name === "string" &&
    row.name.length > 0 &&
    typeof row.colorIndex === "number" &&
    Number.isFinite(row.colorIndex)
  );
}

function sanitizePanelState(raw: unknown): TerminalPanelState | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as TerminalPanelState;
  if (!Array.isArray(data.sessions) || data.sessions.length === 0) return null;

  const sessions = data.sessions
    .filter(isTerminalSession)
    .map((session) => ({
      id: session.id,
      name: session.name.trim().slice(0, 48),
      colorIndex:
        ((session.colorIndex % TERMINAL_SESSION_PALETTE.length) +
          TERMINAL_SESSION_PALETTE.length) %
        TERMINAL_SESSION_PALETTE.length,
    }));

  if (sessions.length === 0) return null;

  const activeId = sessions.some((s) => s.id === data.activeId)
    ? data.activeId
    : sessions[0]!.id;

  const counter =
    typeof data.counter === "number" && data.counter >= sessions.length
      ? data.counter
      : sessions.length;

  return { sessions, activeId, counter };
}

export function loadTerminalPanelState(
  projectId: string,
): TerminalPanelState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    return sanitizePanelState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveTerminalPanelState(
  projectId: string,
  state: TerminalPanelState,
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(state));
  } catch {
    // Quota exceeded or private mode — ignore.
  }
}
