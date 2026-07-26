import { create } from "zustand";

export type DebugSessionStatus =
  | "idle"
  | "running"
  | "exited"
  | "error";

export type DebugBreakpoint = {
  path: string;
  line: number;
};

type DebugState = {
  /** path → sorted unique 1-based line numbers */
  breakpointsByPath: Record<string, number[]>;
  status: DebugSessionStatus;
  output: string;
  exitCode: number | null;
  error: string | null;
  runningPath: string | null;
  commandLine: string | null;

  toggleBreakpoint: (path: string, line: number) => void;
  removeBreakpoint: (path: string, line: number) => void;
  clearBreakpoints: (path?: string) => void;
  listBreakpoints: () => DebugBreakpoint[];
  getBreakpointsForPath: (path: string) => number[];

  beginSession: (path: string, commandLine: string) => void;
  appendOutput: (chunk: string) => void;
  endSession: (exitCode: number) => void;
  failSession: (message: string) => void;
  clearOutput: () => void;
  resetSession: () => void;
};

function sortedUnique(lines: number[]): number[] {
  return [...new Set(lines.filter((n) => n > 0))].sort((a, b) => a - b);
}

export const useDebugStore = create<DebugState>((set, get) => ({
  breakpointsByPath: {},
  status: "idle",
  output: "",
  exitCode: null,
  error: null,
  runningPath: null,
  commandLine: null,

  toggleBreakpoint: (path, line) =>
    set((s) => {
      const current = s.breakpointsByPath[path] ?? [];
      const next = current.includes(line)
        ? current.filter((l) => l !== line)
        : sortedUnique([...current, line]);
      const breakpointsByPath = { ...s.breakpointsByPath };
      if (next.length === 0) delete breakpointsByPath[path];
      else breakpointsByPath[path] = next;
      return { breakpointsByPath };
    }),

  removeBreakpoint: (path, line) =>
    set((s) => {
      const current = s.breakpointsByPath[path] ?? [];
      const next = current.filter((l) => l !== line);
      const breakpointsByPath = { ...s.breakpointsByPath };
      if (next.length === 0) delete breakpointsByPath[path];
      else breakpointsByPath[path] = next;
      return { breakpointsByPath };
    }),

  clearBreakpoints: (path) =>
    set((s) => {
      if (!path) return { breakpointsByPath: {} };
      const breakpointsByPath = { ...s.breakpointsByPath };
      delete breakpointsByPath[path];
      return { breakpointsByPath };
    }),

  listBreakpoints: () => {
    const { breakpointsByPath } = get();
    const list: DebugBreakpoint[] = [];
    for (const [path, lines] of Object.entries(breakpointsByPath)) {
      for (const line of lines) list.push({ path, line });
    }
    return list.sort(
      (a, b) => a.path.localeCompare(b.path) || a.line - b.line,
    );
  },

  getBreakpointsForPath: (path) => get().breakpointsByPath[path] ?? [],

  beginSession: (path, commandLine) =>
    set({
      status: "running",
      output: "",
      exitCode: null,
      error: null,
      runningPath: path,
      commandLine,
    }),

  appendOutput: (chunk) =>
    set((s) => ({
      output: (s.output + chunk).slice(-50_000),
    })),

  endSession: (exitCode) =>
    set({
      status: "exited",
      exitCode,
      runningPath: null,
    }),

  failSession: (message) =>
    set({
      status: "error",
      error: message,
      runningPath: null,
    }),

  clearOutput: () => set({ output: "", error: null }),

  resetSession: () =>
    set({
      status: "idle",
      output: "",
      exitCode: null,
      error: null,
      runningPath: null,
      commandLine: null,
    }),
}));
