"use client";

import { useMonaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useEffect, useState } from "react";

import { getActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { monacoLanguageForPath } from "@/features/workspace/lib/editor-languages";
import { monacoModelPath } from "@/features/workspace/lib/monaco-languages";

export type OutlineSymbolKind =
  | "file"
  | "module"
  | "namespace"
  | "class"
  | "method"
  | "property"
  | "field"
  | "constructor"
  | "enum"
  | "interface"
  | "function"
  | "variable"
  | "constant"
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "key"
  | "enumMember"
  | "struct"
  | "event"
  | "operator"
  | "typeParameter"
  | "type"
  | "unknown";

export type OutlineSymbol = {
  id: string;
  name: string;
  detail?: string;
  kind: OutlineSymbolKind;
  line: number;
  column: number;
  endLine: number;
  endColumn: number;
  children: OutlineSymbol[];
};

type NavigationTree = {
  text: string;
  kind: string;
  kindModifiers?: string;
  spans: Array<{ start: number; length: number }>;
  nameSpan?: { start: number; length: number };
  childItems?: NavigationTree[];
};

const TS_KIND_MAP = {
  file: "file",
  module: "module",
  namespace: "namespace",
  class: "class",
  method: "method",
  property: "property",
  getter: "property",
  setter: "property",
  member: "field",
  "member variable": "field",
  "constructor": "constructor",
  enum: "enum",
  interface: "interface",
  function: "function",
  "local function": "function",
  variable: "variable",
  "local variable": "variable",
  const: "constant",
  let: "variable",
  var: "variable",
  string: "string",
  number: "number",
  boolean: "boolean",
  array: "array",
  object: "object",
  key: "key",
  "enum member": "enumMember",
  type: "type",
  "type parameter": "typeParameter",
  "type alias": "type",
  alias: "type",
  warning: "unknown",
  script: "module",
  directory: "module",
  "external module name": "module",
  "jsx attribute": "property",
} as const satisfies Record<string, OutlineSymbolKind>;

function mapTsKind(kind: string): OutlineSymbolKind {
  return (
    TS_KIND_MAP[kind.toLowerCase() as keyof typeof TS_KIND_MAP] ?? "unknown"
  );
}

function rangeFromSpan(
  model: editor.ITextModel,
  span: { start: number; length: number } | undefined,
): { line: number; column: number; endLine: number; endColumn: number } {
  if (!span || span.length < 0) {
    return { line: 1, column: 1, endLine: 1, endColumn: 1 };
  }
  const start = model.getPositionAt(Math.max(0, span.start));
  const end = model.getPositionAt(
    Math.max(0, Math.min(model.getValueLength(), span.start + span.length)),
  );
  return {
    line: start.lineNumber,
    column: start.column,
    endLine: end.lineNumber,
    endColumn: end.column,
  };
}

function convertNavTree(
  node: NavigationTree,
  model: editor.ITextModel,
  parentId: string,
  index: number,
): OutlineSymbol {
  const span = node.nameSpan ?? node.spans[0];
  const range = rangeFromSpan(model, span);
  const id = `${parentId}/${node.text}:${range.line}:${range.column}:${index}`;
  const children = (node.childItems ?? []).map((child, i) =>
    convertNavTree(child, model, id, i),
  );

  return {
    id,
    name: node.text || "(anonymous)",
    kind: mapTsKind(node.kind),
    detail: node.kindModifiers || undefined,
    ...range,
    children,
  };
}

function isTsLanguage(language: string): boolean {
  return language === "typescript" || language === "javascript";
}

async function fetchTsOutline(
  monaco: NonNullable<ReturnType<typeof useMonaco>>,
  model: editor.ITextModel,
  language: string,
): Promise<OutlineSymbol[]> {
  const tsApi = monaco.typescript;
  if (!tsApi) return [];

  const getWorker =
    language === "javascript"
      ? tsApi.getJavaScriptWorker
      : tsApi.getTypeScriptWorker;

  const workerFactory = await getWorker();
  const worker = await workerFactory(model.uri);
  const tree = (await worker.getNavigationTree(
    model.uri.toString(),
  )) as NavigationTree | undefined;

  if (!tree) return [];

  // Root is usually the file/module — show its children.
  const roots = tree.childItems?.length
    ? tree.childItems
    : tree.text && tree.kind !== "script"
      ? [tree]
      : [];

  return roots.map((child, i) => convertNavTree(child, model, "root", i));
}

/** Lightweight CSS selector / @rule outline when no TS worker applies. */
function fetchCssOutline(model: editor.ITextModel): OutlineSymbol[] {
  const symbols: OutlineSymbol[] = [];
  const lineCount = model.getLineCount();
  const ruleRe =
    /^(\s*)(@[\w-]+|[.#]?[\w-]+(?:\s*[>+~]\s*[\w.#-]+)*(?:\s*,\s*[.#]?[\w-]+)*)\s*\{/;

  for (let line = 1; line <= lineCount; line++) {
    const text = model.getLineContent(line);
    const match = ruleRe.exec(text);
    if (!match) continue;
    const name = match[2]?.trim();
    if (!name) continue;
    const column = (match[1]?.length ?? 0) + 1;
    symbols.push({
      id: `css:${line}:${column}:${name}`,
      name,
      kind: name.startsWith("@") ? "module" : "class",
      line,
      column,
      endLine: line,
      endColumn: column + name.length,
      children: [],
    });
  }

  return symbols;
}

/** HTML element outline — tags with id/class, plus landmarks. */
function fetchHtmlOutline(model: editor.ITextModel): OutlineSymbol[] {
  const symbols: OutlineSymbol[] = [];
  const lineCount = model.getLineCount();
  const tagRe = /<([\w-]+)(?![^>]*\/>)([^>]*)>/g;

  for (let line = 1; line <= lineCount; line++) {
    const text = model.getLineContent(line);
    tagRe.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tagRe.exec(text))) {
      const tag = match[1]?.toLowerCase();
      if (
        !tag ||
        tag === "br" ||
        tag === "hr" ||
        tag === "img" ||
        tag === "meta" ||
        tag === "link" ||
        tag === "input"
      ) {
        continue;
      }
      const attrs = match[2] ?? "";
      const idMatch = /\bid\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const classMatch = /\bclass(?:Name)?\s*=\s*["']([^"']+)["']/i.exec(attrs);
      const interesting =
        Boolean(idMatch) ||
        ["html", "head", "body", "main", "header", "footer", "nav", "section", "article", "aside", "form", "table", "ul", "ol"].includes(
          tag,
        );
      if (!interesting) continue;

      let name = tag;
      if (idMatch?.[1]) name += `#${idMatch[1]}`;
      else if (classMatch?.[1]) {
        const first = classMatch[1].trim().split(/\s+/)[0];
        if (first) name += `.${first}`;
      }

      const column = (match.index ?? 0) + 1;
      symbols.push({
        id: `html:${line}:${column}:${name}`,
        name,
        kind: "field",
        line,
        column,
        endLine: line,
        endColumn: column + name.length,
        children: [],
      });
    }
  }

  return symbols;
}

async function collectOutline(
  monaco: NonNullable<ReturnType<typeof useMonaco>>,
  path: string,
): Promise<OutlineSymbol[]> {
  const uri = monaco.Uri.parse(monacoModelPath(path));
  const model =
    monaco.editor.getModel(uri) ??
    getActiveMonacoEditor(path)?.getModel() ??
    null;
  if (!model) return [];

  const language = monacoLanguageForPath(path);

  if (isTsLanguage(language)) {
    try {
      return await fetchTsOutline(monaco, model, language);
    } catch {
      return [];
    }
  }

  if (language === "css" || language === "scss" || language === "less") {
    return fetchCssOutline(model);
  }

  if (language === "html") {
    return fetchHtmlOutline(model);
  }

  return [];
}

function flattenSymbols(symbols: OutlineSymbol[]): OutlineSymbol[] {
  const out: OutlineSymbol[] = [];
  const walk = (nodes: OutlineSymbol[]) => {
    for (const node of nodes) {
      out.push(node);
      if (node.children.length) walk(node.children);
    }
  };
  walk(symbols);
  return out;
}

/** Find the innermost symbol that contains the cursor. */
export function findActiveSymbolId(
  symbols: OutlineSymbol[],
  line: number,
  column: number,
): string | null {
  let best: OutlineSymbol | null = null;

  for (const symbol of flattenSymbols(symbols)) {
    const afterStart =
      line > symbol.line ||
      (line === symbol.line && column >= symbol.column);
    const beforeEnd =
      line < symbol.endLine ||
      (line === symbol.endLine && column <= symbol.endColumn);
    if (!afterStart || !beforeEnd) continue;

    if (
      !best ||
      symbol.line > best.line ||
      (symbol.line === best.line && symbol.column >= best.column)
    ) {
      best = symbol;
    }
  }

  return best?.id ?? null;
}

/** Live document symbols for the Outline sidebar. */
export function useMonacoOutline(path: string | null) {
  const monaco = useMonaco();
  const [symbols, setSymbols] = useState<OutlineSymbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorColumn, setCursorColumn] = useState(1);

  useEffect(() => {
    if (!monaco || !path) {
      setSymbols([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let contentDisposable: { dispose: () => void } | null = null;
    let modelDisposable: { dispose: () => void } | null = null;

    const refresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        setLoading(true);
        void collectOutline(monaco, path).then((next) => {
          if (cancelled) return;
          setSymbols(next);
          setLoading(false);
        });
      }, 150);
    };

    refresh();

    const uri = monaco.Uri.parse(monacoModelPath(path));
    const model = monaco.editor.getModel(uri);
    if (model) {
      contentDisposable = model.onDidChangeContent(() => refresh());
    }

    modelDisposable = monaco.editor.onDidCreateModel((created) => {
      if (created.uri.toString() === uri.toString()) {
        contentDisposable?.dispose();
        contentDisposable = created.onDidChangeContent(() => refresh());
        refresh();
      }
    });

    return () => {
      cancelled = true;
      if (debounceTimer) clearTimeout(debounceTimer);
      contentDisposable?.dispose();
      modelDisposable?.dispose();
    };
  }, [monaco, path]);

  useEffect(() => {
    if (!path) return;

    let disposed = false;
    let cursorDisposable: { dispose: () => void } | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;

    const attach = () => {
      const ed = getActiveMonacoEditor(path);
      if (!ed || disposed) return false;

      const pos = ed.getPosition();
      if (pos) {
        setCursorLine(pos.lineNumber);
        setCursorColumn(pos.column);
      }

      cursorDisposable?.dispose();
      cursorDisposable = ed.onDidChangeCursorPosition((e) => {
        setCursorLine(e.position.lineNumber);
        setCursorColumn(e.position.column);
      });
      return true;
    };

    if (!attach()) {
      poll = setInterval(() => {
        if (attach() && poll) {
          clearInterval(poll);
          poll = null;
        }
      }, 200);
    }

    return () => {
      disposed = true;
      cursorDisposable?.dispose();
      if (poll) clearInterval(poll);
    };
  }, [path, symbols]);

  const activeSymbolId = findActiveSymbolId(symbols, cursorLine, cursorColumn);

  return { symbols, loading, activeSymbolId, cursorLine, cursorColumn };
}
