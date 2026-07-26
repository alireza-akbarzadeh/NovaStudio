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
  /** Stable id for this terminal instance (multi-terminal). */
  sessionId?: string;
  /** Only the active session consumes cwd / command requests. */
  active?: boolean;
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

export function WorkspaceTerminal({
  projectId,
  sessionId = "default",
  active = true,
}: WorkspaceTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const cwdRef = useRef("/");
  const historyRef = useRef(new CommandHistory());
  const editorRef = useRef<TerminalLineEditor | null>(null);
  const executeRef = useRef<(command: string) => Promise<void>>(
    async () => undefined,
  );
  const activeRef = useRef(active);
  activeRef.current = active;

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
  const setTerminalCwd = useWorkspaceStore((s) => s.setTerminalCwd);
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
    if (!active) return;
    if (!terminalCwdRequest) return;

    cwdRef.current = terminalCwdRequest;
    setTerminalCwd(terminalCwdRequest);
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
  }, [active, clearTerminalCwdRequest, setTerminalCwd, terminalCwdRequest]);

  useEffect(() => {
    if (!active) return;
    if (!terminalCommandRequest) return;
    // Wait until xterm + execute are ready so we don't drop the command.
    if (!terminalRef.current || !editorRef.current) return;

    const command = terminalCommandRequest;
    clearTerminalCommandRequest();
    const term = terminalRef.current;
    term.writeln(`\r\n→ ${command}`);
    void executeRef.current(command);
  }, [active, clearTerminalCommandRequest, terminalCommandRequest]);

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
      // Blinking + per-keystroke paints reads as flashy; steady bar feels calmer.
      cursorBlink: false,
      cursorStyle: "bar",
      cursorWidth: 1,
      fontFamily,
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 1.2,
      letterSpacing,
      theme: isDarkRef.current ? TERMINAL_THEME_DARK : TERMINAL_THEME_LIGHT,
      scrollback: 5000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    term.options.letterSpacing = letterSpacing;

    /** Only refit when cols/rows actually change — thrashing fit() flashes the screen. */
    const fitTerminal = () => {
      const proposed = fitAddon.proposeDimensions();
      if (!proposed || proposed.cols < 2 || proposed.rows < 1) return;
      if (proposed.cols === term.cols && proposed.rows === term.rows) return;
      fitAddon.fit();
    };

    fitTerminal();
    terminalRef.current = term;

    void document.fonts.ready.then(() => {
      if (terminalRef.current !== term) return;
      term.options.fontFamily = resolveTerminalFontFamily();
      term.options.letterSpacing = resolveTerminalLetterSpacing();
      fitTerminal();
    });

    const writePrompt = (t: Terminal, newline = false) => {
      const cols = writeShellPrompt(t, {
        projectName: projectNameRef.current,
        cwd: cwdRef.current,
        branch: branchRef.current,
        dirty: dirtyRef.current,
        isDark: isDarkRef.current,
        newline,
      });
      editorRef.current?.setPromptCols(cols);
      return cols;
    };

    // Cache parsed scripts — avoid JSON.parse(package.json) on every keystroke.
    let scriptsCacheKey = "";
    let scriptsCache: string[] = [];
    const getCompleteContext = (): CompleteContext => {
      const files = filesRef.current ?? [];
      const cwd = cwdRef.current;
      const pkgs = files
        .filter((f) => f.kind === "file" && f.path.endsWith("package.json"))
        .map((f) => `${f.path}:${(f.content ?? "").length}:${(f.content ?? "").slice(0, 48)}`)
        .join("|");
      const key = `${cwd}::${pkgs}`;
      if (key !== scriptsCacheKey) {
        scriptsCacheKey = key;
        scriptsCache = getPackageScripts(files, cwd);
      }
      return {
        cwd,
        files,
        history: historyRef.current,
        scripts: scriptsCache,
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
              cols: term.cols,
              rows: term.rows,
              onChunk: (chunk) => {
                term.write(chunk.replace(/\n/g, "\r\n"));
              },
              onStdin: (write) => {
                editorRef.current?.setStdinForward(write);
              },
              onStdinEnd: () => {
                editorRef.current?.setStdinForward(null);
              },
            });

            editorRef.current?.setStdinForward(null);

            if (exitCode === 0 && wc.shouldSyncTreeAfterCommand(binary, args)) {
              try {
                term.writeln("\r\n[novastudio] syncing new files into project…");
                const synced = await wc.syncTree();
                term.writeln(
                  `[novastudio] synced ${synced.length} file${synced.length === 1 ? "" : "s"}`,
                );
                await wc.refreshInstallState();
              } catch (syncError) {
                term.writeln(
                  `\r\n[novastudio] failed to sync files: ${
                    syncError instanceof Error
                      ? syncError.message
                      : "unknown error"
                  }`,
                );
              }
            } else if (wc.shouldSyncAfterCommand(args)) {
              try {
                const synced = await wc.syncManifests();
                if (synced.length > 0) {
                  term.writeln(
                    `\r\n[novastudio] synced ${synced.join(", ")} to project`,
                  );
                }
                await wc.refreshInstallState();
              } catch (syncError) {
                term.writeln(
                  `\r\n[novastudio] failed to sync lockfile: ${
                    syncError instanceof Error
                      ? syncError.message
                      : "unknown error"
                  }`,
                );
              }
            }
            return { output: "", exitCode, cwd };
          } catch (error) {
            editorRef.current?.setStdinForward(null);
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
        if (activeRef.current) {
          setTerminalCwd(result.cwd);
        }
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
    term.writeln("NovaStudio workspace terminal");
    term.writeln(
      "Type 'help' for commands. Tab completes · paste with Ctrl+V · → accepts suggestion · ↑↓ history",
    );
    term.writeln(
      statusBannerLine(wc?.status ?? "idle", wc?.error ?? null),
    );
    editor.setPromptCols(writePrompt(term, true));

    // Consume any command queued before the terminal finished mounting.
    const pending = useWorkspaceStore.getState().terminalCommandRequest;
    if (pending && activeRef.current) {
      useWorkspaceStore.getState().clearTerminalCommandRequest();
      term.writeln(`\r\n→ ${pending}`);
      void execute(pending);
    }

    const dataDisposable = term.onData((data) => editor.handleData(data));

    // Capture-phase paste so we handle it once (xterm's textarea would also
    // fire onData and could double-insert or drop trailing-newline pastes).
    const onPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const text = event.clipboardData?.getData("text/plain") ?? "";
      editor.insertPaste(text);
    };
    container.addEventListener("paste", onPaste, true);

    let resizeRaf = 0;
    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(fitTerminal);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(resizeRaf);
      dataDisposable.dispose();
      container.removeEventListener("paste", onPaste, true);
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
    <div className="flex h-full flex-col bg-ws-panel" data-terminal-session={sessionId}>
      <div
        ref={containerRef}
        className="min-h-0 flex-1 overflow-hidden bg-ws-panel p-2 font-terminal [&_.xterm]:h-full [&_.xterm-viewport]:bg-transparent! [&_.xterm-screen]:h-full"
      />
    </div>
  );
}
