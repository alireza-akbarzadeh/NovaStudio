"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useTheme } from "next-themes";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { useOptionalWebContainer } from "@/features/workspace/components/webcontainer-provider";
import { useTerminalShell } from "@/features/workspace/hooks/use-terminal-shell";
import type { CompleteContext } from "@/features/workspace/lib/terminal/complete";
import {
  resolveTerminalFontFamily,
  resolveTerminalLetterSpacing,
} from "@/features/workspace/lib/terminal/font";
import { CommandHistory } from "@/features/workspace/lib/terminal/history";
import { TerminalLineEditor } from "@/features/workspace/lib/terminal/line-editor";
import { getPackageScripts } from "@/features/workspace/lib/terminal/package-scripts";
import { writeShellPrompt } from "@/features/workspace/lib/terminal/prompt";
import {
  TERMINAL_THEME_DARK,
  TERMINAL_THEME_LIGHT,
} from "@/features/workspace/lib/terminal/themes";
import type { ShellHandlers } from "@/features/workspace/lib/terminal/types";
import {
  CLEAR_SCREEN,
  runShellCommand,
} from "@/features/workspace/lib/workspace-shell";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

import "@xterm/xterm/css/xterm.css";

type WorkspaceTerminalProps = {
  projectId: string;
};

function statusBannerLine(
  status: string,
  error: string | null,
): string {
  switch (status) {
    case "booting":
      return "WebContainer: booting Node runtime…";
    case "mounting":
      return "WebContainer: mounting project files…";
    case "ready":
      return "WebContainer: ready — npm/pnpm/yarn/bun run for real";
    case "error":
      return `WebContainer: unavailable — ${error ?? "boot failed"}`;
    default:
      return "WebContainer: starting…";
  }
}

export function WorkspaceTerminal({ projectId }: WorkspaceTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const cwdRef = useRef("/");
  const historyRef = useRef(new CommandHistory());
  const editorRef = useRef<TerminalLineEditor | null>(null);
  const executeRef = useRef<(command: string) => Promise<void>>(
    async () => undefined,
  );

  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";
  const isDarkRef = useRef(isDark);

  const { projectName, branch, dirty, getContext, createHandlers, filesRef } =
    useTerminalShell(projectId);
  const webcontainer = useOptionalWebContainer();
  const webcontainerRef = useRef(webcontainer);
  webcontainerRef.current = webcontainer;

  const projectNameRef = useRef(projectName);
  const branchRef = useRef(branch);
  const dirtyRef = useRef(dirty);

  const terminalCwdRequest = useWorkspaceStore((s) => s.terminalCwdRequest);
  const clearTerminalCwdRequest = useWorkspaceStore(
    (s) => s.clearTerminalCwdRequest,
  );
  const terminalCommandRequest = useWorkspaceStore(
    (s) => s.terminalCommandRequest,
  );
  const clearTerminalCommandRequest = useWorkspaceStore(
    (s) => s.clearTerminalCommandRequest,
  );

  const getContextRef = useRef(getContext);
  const createHandlersRef = useRef(createHandlers);

  useEffect(() => {
    projectNameRef.current = projectName;
    branchRef.current = branch;
    dirtyRef.current = dirty;
    isDarkRef.current = isDark;
    getContextRef.current = getContext;
    createHandlersRef.current = createHandlers;
  }, [projectName, branch, dirty, isDark, getContext, createHandlers]);

  useEffect(() => {
    if (!terminalCwdRequest) return;

    cwdRef.current = terminalCwdRequest;
    const term = terminalRef.current;
    if (term) {
      term.writeln(`\r\nChanged directory to ${terminalCwdRequest}`);
      writeShellPrompt(term, {
        projectName: projectNameRef.current,
        cwd: cwdRef.current,
        branch: branchRef.current,
        dirty: dirtyRef.current,
        isDark: isDarkRef.current,
        newline: true,
      });
    }
    clearTerminalCwdRequest();
  }, [clearTerminalCwdRequest, terminalCwdRequest]);

  useEffect(() => {
    if (!terminalCommandRequest) return;
    // Wait until xterm + execute are ready so we don't drop the command.
    if (!terminalRef.current || !editorRef.current) return;

    const command = terminalCommandRequest;
    clearTerminalCommandRequest();
    const term = terminalRef.current;
    term.writeln(`\r\n→ ${command}`);
    void executeRef.current(command);
  }, [clearTerminalCommandRequest, terminalCommandRequest]);

  // Surface WebContainer status changes in the terminal
  const lastStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!webcontainer) return;
    const key = `${webcontainer.status}:${webcontainer.error ?? ""}`;
    if (lastStatusRef.current === key) return;
    // Skip the very first paint — welcome banner already covers it
    if (lastStatusRef.current === null) {
      lastStatusRef.current = key;
      return;
    }
    lastStatusRef.current = key;
    const term = terminalRef.current;
    if (!term) return;
    term.writeln("");
    term.writeln(statusBannerLine(webcontainer.status, webcontainer.error));
    writeShellPrompt(term, {
      projectName: projectNameRef.current,
      cwd: cwdRef.current,
      branch: branchRef.current,
      dirty: dirtyRef.current,
      isDark: isDarkRef.current,
      newline: true,
    });
  }, [webcontainer]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || terminalRef.current) return;

    const fontFamily = resolveTerminalFontFamily();
    const letterSpacing = resolveTerminalLetterSpacing();

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      cursorWidth: 1,
      fontFamily,
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 1.25,
      letterSpacing,
      theme: isDarkRef.current ? TERMINAL_THEME_DARK : TERMINAL_THEME_LIGHT,
      scrollback: 5000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    term.options.letterSpacing = letterSpacing;
    fitAddon.fit();
    terminalRef.current = term;

    void document.fonts.ready.then(() => {
      if (terminalRef.current !== term) return;
      term.options.fontFamily = resolveTerminalFontFamily();
      term.options.letterSpacing = resolveTerminalLetterSpacing();
      fitAddon.fit();
      term.refresh(0, term.rows - 1);
    });

    const writePrompt = (t: Terminal, newline = false) => {
      writeShellPrompt(t, {
        projectName: projectNameRef.current,
        cwd: cwdRef.current,
        branch: branchRef.current,
        dirty: dirtyRef.current,
        isDark: isDarkRef.current,
        newline,
      });
    };

    const getCompleteContext = (): CompleteContext => {
      const files = filesRef.current ?? [];
      return {
        cwd: cwdRef.current,
        files,
        history: historyRef.current,
        scripts: getPackageScripts(files, cwdRef.current),
      };
    };

    const execute = async (command: string) => {
      const context = getContextRef.current(cwdRef.current);
      if (!context) {
        term.writeln("Project is still loading…");
        writePrompt(term, false);
        return;
      }

      if (command.trim()) {
        historyRef.current.push(command);
      }

      const handlers: ShellHandlers = createHandlersRef.current((line) => {
        term.writeln(line);
      });

      const wc = webcontainerRef.current;
      if (wc?.ready) {
        handlers.runInWebContainer = async (binary, args, cwd) => {
          try {
            const exitCode = await wc.spawn(binary, args, {
              cwd,
              onChunk: (chunk) => {
                term.write(chunk.replace(/\n/g, "\r\n"));
              },
            });
            if (wc.shouldSyncAfterCommand(args)) {
              try {
                const synced = await wc.syncManifests();
                if (synced.length > 0) {
                  term.writeln(
                    `\r\n[polaris] synced ${synced.join(", ")} to project`,
                  );
                }
                await wc.refreshInstallState();
              } catch (syncError) {
                term.writeln(
                  `\r\n[polaris] failed to sync lockfile: ${
                    syncError instanceof Error
                      ? syncError.message
                      : "unknown error"
                  }`,
                );
              }
            }
            return { output: "", exitCode, cwd };
          } catch (error) {
            return {
              output:
                error instanceof Error
                  ? error.message
                  : "WebContainer command failed",
              exitCode: 1,
              cwd,
            };
          }
        };
      }

      const result = await runShellCommand(command, context, handlers);

      if (result.cwd) {
        cwdRef.current = result.cwd;
      }

      if (result.output === CLEAR_SCREEN) {
        term.reset();
        writePrompt(term, false);
        return;
      }

      if (result.output) {
        term.write(`${result.output.replace(/\n/g, "\r\n")}\r\n`);
      }

      writePrompt(term, false);
    };

    executeRef.current = execute;

    const editor = new TerminalLineEditor(
      term,
      historyRef.current,
      writePrompt,
      getCompleteContext,
      execute,
    );
    editorRef.current = editor;

    const wc = webcontainerRef.current;
    term.writeln("Polaris workspace terminal");
    term.writeln(
      "Type 'help' for commands. Tab completes · → accepts suggestion · ↑↓ history",
    );
    term.writeln(
      statusBannerLine(wc?.status ?? "idle", wc?.error ?? null),
    );
    writePrompt(term, true);

    // Consume any command queued before the terminal finished mounting.
    const pending = useWorkspaceStore.getState().terminalCommandRequest;
    if (pending) {
      useWorkspaceStore.getState().clearTerminalCommandRequest();
      term.writeln(`\r\n→ ${pending}`);
      void execute(pending);
    }

    const dataDisposable = term.onData((data) => editor.handleData(data));
    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(container);

    return () => {
      dataDisposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      terminalRef.current = null;
      editorRef.current = null;
    };
    // Mount once — live data is read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, []);

  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    term.options.theme = isDark ? TERMINAL_THEME_DARK : TERMINAL_THEME_LIGHT;
  }, [isDark]);

  return (
    <div className="flex h-full flex-col bg-ws-panel">
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden bg-ws-panel p-2 font-terminal [&_.xterm]:h-full [&_.xterm-viewport]:bg-transparent! [&_.xterm-screen]:h-full"
      />
    </div>
  );
}
