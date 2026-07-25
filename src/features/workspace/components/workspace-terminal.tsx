"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useTheme } from "next-themes";
import { useEffect, useRef, useSyncExternalStore } from "react";

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
import {
  CLEAR_SCREEN,
  runShellCommand,
} from "@/features/workspace/lib/workspace-shell";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

import "@xterm/xterm/css/xterm.css";

type WorkspaceTerminalProps = {
  projectId: string;
};

export function WorkspaceTerminal({ projectId }: WorkspaceTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const cwdRef = useRef("/");
  const historyRef = useRef(new CommandHistory());
  const editorRef = useRef<TerminalLineEditor | null>(null);

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
  const projectNameRef = useRef(projectName);
  const branchRef = useRef(branch);
  const dirtyRef = useRef(dirty);

  const terminalCwdRequest = useWorkspaceStore((s) => s.terminalCwdRequest);
  const clearTerminalCwdRequest = useWorkspaceStore(
    (s) => s.clearTerminalCwdRequest,
  );

  // Stable refs so the xterm session is created once
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
    const container = containerRef.current;
    if (!container || terminalRef.current) return;

    const fontFamily = resolveTerminalFontFamily();
    const letterSpacing = resolveTerminalLetterSpacing();

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      cursorWidth: 1,
      // Canvas cannot resolve CSS vars — use the real next/font family name
      fontFamily,
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 1.25,
      // DomRenderer: device px (see resolveTerminalLetterSpacing)
      letterSpacing,
      theme: isDarkRef.current ? TERMINAL_THEME_DARK : TERMINAL_THEME_LIGHT,
      scrollback: 2000,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(container);
    // Re-apply after open so DomRenderer recomputes cell width + CSS spacing
    term.options.letterSpacing = letterSpacing;
    fitAddon.fit();
    terminalRef.current = term;

    // Re-measure after next/font finishes loading so cell widths match glyphs
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
        // Re-read on every keystroke so package.json script edits stay live
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

      const handlers = createHandlersRef.current((line) => {
        term.writeln(line);
      });

      const result = await runShellCommand(command, context, handlers);

      if (result.cwd) {
        cwdRef.current = result.cwd;
      }

      if (result.output === CLEAR_SCREEN) {
        // Full reset so the next prompt isn't appended after the typed command.
        term.reset();
        writePrompt(term, false);
        return;
      }

      if (result.output) {
        term.write(`${result.output.replace(/\n/g, "\r\n")}\r\n`);
      }

      writePrompt(term, false);
    };

    const editor = new TerminalLineEditor(
      term,
      historyRef.current,
      writePrompt,
      getCompleteContext,
      execute,
    );
    editorRef.current = editor;

    term.writeln("Polaris workspace terminal (simulated shell)");
    term.writeln(
      "Type 'help' for commands. Tab completes · → accepts suggestion · ↑↓ history",
    );
    term.writeln(
      "npm/pnpm/yarn/bun scripts autocomplete from package.json (live)",
    );
    writePrompt(term, true);

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
