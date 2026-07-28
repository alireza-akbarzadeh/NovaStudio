import type { editor, IDisposable } from "monaco-editor";

import {
  runCommand,
  workspaceCommands,
  type CommandId,
} from "@/features/workspace/commands/registry";
import { requestInlineAiEdit } from "@/features/workspace/lib/monaco-inline-ai-edit";
import { SEARCH_EVERYWHERE_CHORD } from "@/lib/keyboard";

type MonacoModule = typeof import("monaco-editor");

function chordToKeybinding(
  monaco: MonacoModule,
  chord: string,
): number | undefined {
  const parts = chord
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  let mods = 0;
  let keyPart: string | undefined;

  for (const part of parts) {
    if (part === "mod") {
      mods |= monaco.KeyMod.CtrlCmd;
      continue;
    }
    if (part === "alt" || part === "option") {
      mods |= monaco.KeyMod.Alt;
      continue;
    }
    if (part === "shift") {
      mods |= monaco.KeyMod.Shift;
      continue;
    }
    if (part === "ctrl" || part === "control" || part === "meta") {
      mods |= monaco.KeyMod.CtrlCmd;
      continue;
    }
    keyPart = part;
  }

  if (!keyPart) return undefined;

  const keyCodes: Record<string, number> = {
    a: monaco.KeyCode.KeyA,
    b: monaco.KeyCode.KeyB,
    c: monaco.KeyCode.KeyC,
    d: monaco.KeyCode.KeyD,
    e: monaco.KeyCode.KeyE,
    f: monaco.KeyCode.KeyF,
    g: monaco.KeyCode.KeyG,
    h: monaco.KeyCode.KeyH,
    i: monaco.KeyCode.KeyI,
    j: monaco.KeyCode.KeyJ,
    k: monaco.KeyCode.KeyK,
    l: monaco.KeyCode.KeyL,
    m: monaco.KeyCode.KeyM,
    n: monaco.KeyCode.KeyN,
    o: monaco.KeyCode.KeyO,
    p: monaco.KeyCode.KeyP,
    q: monaco.KeyCode.KeyQ,
    r: monaco.KeyCode.KeyR,
    s: monaco.KeyCode.KeyS,
    t: monaco.KeyCode.KeyT,
    u: monaco.KeyCode.KeyU,
    v: monaco.KeyCode.KeyV,
    w: monaco.KeyCode.KeyW,
    x: monaco.KeyCode.KeyX,
    y: monaco.KeyCode.KeyY,
    z: monaco.KeyCode.KeyZ,
    ",": monaco.KeyCode.Comma,
    ".": monaco.KeyCode.Period,
    escape: monaco.KeyCode.Escape,
    esc: monaco.KeyCode.Escape,
    f2: monaco.KeyCode.F2,
    f12: monaco.KeyCode.F12,
  };

  const keyCode = keyCodes[keyPart];
  if (keyCode == null) return undefined;
  return mods | keyCode;
}

function isMonacoSearchEverywhere(
  event: {
    keyCode: number;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
  },
  monaco: MonacoModule,
): boolean {
  return (
    event.keyCode === monaco.KeyCode.KeyF &&
    event.shiftKey &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey
  );
}

function runMonacoCommand(id: CommandId, chord: string) {
  if (id === "openCommandPalette" && chord === "mod+k") {
    if (!requestInlineAiEdit()) {
      runCommand("openCommandPalette");
    }
    return;
  }
  runCommand(id);
}

/** Monaco-side bindings so Ctrl/Cmd shortcuts work while the editor is focused. */
export function registerMonacoWorkspaceShortcuts(
  editorInstance: editor.IStandaloneCodeEditor,
  monaco: MonacoModule,
): IDisposable {
  const disposables: IDisposable[] = [];

  // Search Everywhere — register first and also hook Monaco's key pipeline.
  const searchEverywhereBinding = chordToKeybinding(
    monaco,
    SEARCH_EVERYWHERE_CHORD,
  );
  if (searchEverywhereBinding != null) {
    disposables.push(
      editorInstance.addAction({
        id: "polaris.workspace.search-everywhere",
        label: "Search Everywhere",
        keybindings: [searchEverywhereBinding],
        run: () => runCommand("openCommandPalette"),
      }),
    );
  }

  disposables.push(
    editorInstance.onKeyDown((event) => {
      if (!isMonacoSearchEverywhere(event, monaco)) return;
      event.preventDefault();
      event.stopPropagation();
      runCommand("openCommandPalette");
    }),
  );

  for (const command of workspaceCommands) {
    const chords = [command.shortcut, ...(command.aliases ?? [])].filter(
      Boolean,
    ) as string[];

    for (const chord of chords) {
      if (command.id === "openCommandPalette" && chord === SEARCH_EVERYWHERE_CHORD) {
        continue;
      }

      const keybinding = chordToKeybinding(monaco, chord);
      if (keybinding == null) continue;

      disposables.push(
        editorInstance.addAction({
          id: `polaris.workspace.${command.id}.${chord.replaceAll("+", "-")}`,
          label: command.id,
          keybindings: [keybinding],
          run: () => runMonacoCommand(command.id, chord),
        }),
      );
    }
  }

  return {
    dispose: () => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    },
  };
}
