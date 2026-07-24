import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import {
  getWorker,
  MonacoJsxSyntaxHighlight,
} from "monaco-jsx-syntax-highlight";

/** True when Monaco needs the extra JSX decoration highlighter. */
export function isJsxFilePath(filePath: string): boolean {
  return /\.(tsx|jsx)$/i.test(filePath);
}

let sharedController: MonacoJsxSyntaxHighlight | null = null;
let sharedMonaco: Monaco | null = null;
let editorCount = 0;

function getSharedController(monaco: Monaco): MonacoJsxSyntaxHighlight {
  if (sharedController && sharedMonaco === monaco) {
    return sharedController;
  }
  sharedController?.dispose();
  sharedMonaco = monaco;
  // Same-origin TS — CDN importScripts is flaky / blocked in some browsers.
  sharedController = new MonacoJsxSyntaxHighlight(getWorker(), monaco, {
    customTypescriptUrl: `${window.location.origin}/api/monaco-typescript`,
  });
  return sharedController;
}

/**
 * Path passed to the highlight worker's createSourceFile.
 * Must be unique per editor (reply matching) and end with .tsx/.jsx (ScriptKind).
 */
function highlightFileName(filePath: string, modelUri?: string): string {
  const source = (modelUri || filePath).replace(/\\/g, "/");
  const clean = source.split("?")[0]?.split("#")[0] ?? source;
  if (/\.tsx$/i.test(clean) || /\.jsx$/i.test(clean)) return clean;

  const base = clean.replace(/^file:\/+/, "").replace(/\/+$/, "") || "module";
  if (/\.jsx$/i.test(filePath)) return `${base}.jsx`;
  return `${base}.tsx`;
}

/**
 * Monaco does not color JSX tags natively — only validates them.
 * This wires monaco-jsx-syntax-highlight decorations for .tsx / .jsx.
 */
export function registerJsxSyntaxHighlight(
  monaco: Monaco,
  editorInstance: editor.IStandaloneCodeEditor,
  filePath: string,
): IDisposable | null {
  if (!isJsxFilePath(filePath)) return null;

  const controller = getSharedController(monaco);
  editorCount += 1;

  const modelUri = editorInstance.getModel()?.uri.toString();
  // Worker uses filePath only for ScriptKind — keep a clean .tsx/.jsx name.
  // Matching reply still keys off this same string.
  const analysisPath = highlightFileName(filePath, modelUri);

  const { highlighter, dispose } = controller.highlighterBuilder(
    {
      editor: editorInstance,
      filePath: analysisPath,
    },
    {
      jsxTagCycle: 3,
      enableConsole: process.env.NODE_ENV === "development",
    },
  );

  highlighter();
  const contentSub = editorInstance.onDidChangeModelContent(() => {
    highlighter();
  });

  return {
    dispose: () => {
      contentSub.dispose();
      dispose();
      editorCount = Math.max(0, editorCount - 1);
      if (editorCount === 0) {
        sharedController?.dispose();
        sharedController = null;
        sharedMonaco = null;
      }
    },
  };
}
