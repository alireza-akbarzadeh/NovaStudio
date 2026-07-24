import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, Position } from "monaco-editor";

import { monacoModelPath } from "@/features/workspace/lib/monaco-languages";
import {
  buildFileContentMap,
  normalizeRelativePath,
  resolveImportPath,
  type ProjectFileEntry,
} from "@/features/workspace/lib/resolve-import-path";

export type DefinitionTarget = {
  path: string;
  line: number;
  column: number;
};

export type GoToDefinitionContext = {
  currentPath: string;
  files: ProjectFileEntry[];
  onNavigate: (target: DefinitionTarget) => void;
};

type ParsedImport = {
  /** Module specifier inside quotes. */
  module: string;
  /** Local binding → whether it is the default import. */
  bindings: Map<string, { isDefault: boolean; importedName: string }>;
  /** Character range of the module string (1-based columns on `line`). */
  moduleLine: number;
  moduleStartCol: number;
  moduleEndCol: number;
};

const HTML_INTRINSICS = new Set([
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "search",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "svg",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "path",
  "circle",
  "rect",
  "g",
  "defs",
  "clipPath",
  "linearGradient",
  "radialGradient",
  "stop",
  "mask",
  "pattern",
  "use",
  "symbol",
  "text",
  "tspan",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "foreignObject",
]);

const IMPORT_LINE_RE =
  /^\s*import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/;
const SIDE_EFFECT_IMPORT_RE = /^\s*import\s+['"]([^'"]+)['"]/;
const REQUIRE_RE = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/;

/** Navigators keyed by editor instance — used by the shared editor opener. */
const navigators = new WeakMap<
  editor.ICodeEditor,
  (target: DefinitionTarget) => void
>();

let openerRegistered = false;
let definitionProvidersRegistered = false;

function ensureEditorOpener(monaco: Monaco) {
  if (openerRegistered) return;
  openerRegistered = true;

  monaco.editor.registerEditorOpener({
    openCodeEditor(
      source: editor.ICodeEditor | null,
      resource: { path: string },
      selectionOrPosition?:
        | { startLineNumber: number; startColumn: number }
        | { lineNumber: number; column: number }
        | null,
    ) {
      if (!source) return false;
      const navigate = navigators.get(source);
      if (!navigate) return false;

      const path = normalizeRelativePath(
        resource.path.replace(/^\//, ""),
      );
      if (!path) return false;

      let line = 1;
      let column = 1;
      if (selectionOrPosition) {
        if ("startLineNumber" in selectionOrPosition) {
          line = selectionOrPosition.startLineNumber;
          column = selectionOrPosition.startColumn;
        } else {
          line = selectionOrPosition.lineNumber;
          column = selectionOrPosition.column;
        }
      }

      navigate({ path, line, column });
      return true;
    },
  });
}

function parseImportClause(
  clause: string,
): Map<string, { isDefault: boolean; importedName: string }> {
  const bindings = new Map<
    string,
    { isDefault: boolean; importedName: string }
  >();
  const trimmed = clause.trim();
  if (!trimmed) return bindings;

  // default + named: `Foo, { Bar as Baz }`
  // namespace: `* as Foo`
  // named only: `{ Foo, Bar as Baz }`
  // default only: `Foo`

  const star = trimmed.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)/);
  if (star?.[1]) {
    bindings.set(star[1], { isDefault: true, importedName: "default" });
    return bindings;
  }

  let rest = trimmed;
  if (!rest.startsWith("{")) {
    const comma = rest.indexOf(",");
    const defaultName = (comma === -1 ? rest : rest.slice(0, comma)).trim();
    if (/^[A-Za-z_$][\w$]*$/.test(defaultName)) {
      bindings.set(defaultName, {
        isDefault: true,
        importedName: "default",
      });
    }
    rest = comma === -1 ? "" : rest.slice(comma + 1).trim();
  }

  const named = rest.match(/\{([^}]*)\}/);
  if (named?.[1]) {
    for (const part of named[1].split(",")) {
      const piece = part.trim();
      if (!piece || piece.startsWith("type ")) continue;
      const asMatch = piece.match(
        /^(?:type\s+)?([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/,
      );
      if (asMatch?.[1] && asMatch[2]) {
        bindings.set(asMatch[2], {
          isDefault: false,
          importedName: asMatch[1],
        });
        continue;
      }
      const plain = piece.replace(/^type\s+/, "").trim();
      if (/^[A-Za-z_$][\w$]*$/.test(plain)) {
        bindings.set(plain, { isDefault: false, importedName: plain });
      }
    }
  }

  return bindings;
}

function parseImports(source: string): ParsedImport[] {
  const results: ParsedImport[] = [];
  const lines = source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lineNumber = i + 1;

    const side = line.match(SIDE_EFFECT_IMPORT_RE);
    if (side?.[1]) {
      const module = side[1];
      const start = line.indexOf(module);
      results.push({
        module,
        bindings: new Map(),
        moduleLine: lineNumber,
        moduleStartCol: start + 1,
        moduleEndCol: start + module.length + 1,
      });
      continue;
    }

    // Multi-line import: join until `from '…'`
    let block = line;
    let endLine = i;
    if (
      /^\s*import\b/.test(line) &&
      !/from\s+['"]/.test(line) &&
      !SIDE_EFFECT_IMPORT_RE.test(line)
    ) {
      while (endLine + 1 < lines.length && !/from\s+['"]/.test(block)) {
        endLine += 1;
        block += ` ${lines[endLine]}`;
      }
    }

    const match = block.match(IMPORT_LINE_RE);
    if (match?.[1] && match[2]) {
      const module = match[2];
      // Locate module string on the ending line of the block.
      const moduleLineText = lines[endLine] ?? line;
      const start = moduleLineText.indexOf(module);
      results.push({
        module,
        bindings: parseImportClause(match[1]),
        moduleLine: endLine + 1,
        moduleStartCol: start >= 0 ? start + 1 : 1,
        moduleEndCol: start >= 0 ? start + module.length + 1 : 1,
      });
      i = endLine;
      continue;
    }

    const req = line.match(REQUIRE_RE);
    if (req?.[1]) {
      const module = req[1];
      const start = line.indexOf(module);
      results.push({
        module,
        bindings: new Map(),
        moduleLine: lineNumber,
        moduleStartCol: start + 1,
        moduleEndCol: start + module.length + 1,
      });
    }
  }

  return results;
}

function findJsxTagAtPosition(
  model: editor.ITextModel,
  position: Position,
): string | null {
  const line = model.getLineContent(position.lineNumber);
  const word = model.getWordAtPosition(position);
  if (!word) return null;

  const name = word.word;
  if (!/^[A-Z][A-Za-z0-9_]*$/.test(name)) return null;
  if (HTML_INTRINSICS.has(name.toLowerCase())) return null;

  const before = line.slice(0, word.startColumn - 1);
  // `<Foo` or `</Foo`
  if (!/<\/?\s*$/.test(before)) {
    return null;
  }

  return name;
}

function findSymbolInContent(
  content: string,
  symbol: string | null,
  preferDefault: boolean,
): { line: number; column: number } {
  const lines = content.split(/\r?\n/);

  const tryPatterns = (patterns: RegExp[]): { line: number; column: number } | null => {
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i] ?? "";
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const idx = match.index ?? 0;
          const name = match[1] ?? match[0];
          const nameIdx = name ? text.indexOf(name, idx) : idx;
          return {
            line: i + 1,
            column: Math.max(1, nameIdx + 1),
          };
        }
      }
    }
    return null;
  };

  if (preferDefault || !symbol) {
    const defaultHit =
      tryPatterns([
        /\bexport\s+default\s+function\s+([A-Za-z_$][\w$]*)/,
        /\bexport\s+default\s+class\s+([A-Za-z_$][\w$]*)/,
        /\bexport\s+default\s+([A-Za-z_$][\w$]*)/,
      ]) ??
      tryPatterns([/\bexport\s+\{\s*default\s*\}/]);
    if (defaultHit) return defaultHit;
  }

  if (symbol) {
    const named = tryPatterns([
      new RegExp(
        String.raw`\bexport\s+(?:async\s+)?function\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\bexport\s+class\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\bexport\s+(?:const|let|var)\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\bexport\s+type\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\bexport\s+interface\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\bexport\s+enum\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\bexport\s*\{[^}]*\b(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\b(?:async\s+)?function\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(
        String.raw`\b(?:const|let|var)\s+(${escapeRegExp(symbol)})\b`,
      ),
      new RegExp(String.raw`\bclass\s+(${escapeRegExp(symbol)})\b`),
    ]);
    if (named) return named;
  }

  return { line: 1, column: 1 };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readModelContent(
  monaco: Monaco,
  path: string,
  contentMap: Map<string, string>,
): string {
  const uri = monaco.Uri.parse(monacoModelPath(path));
  const model = monaco.editor.getModel(uri);
  if (model) return model.getValue();
  return contentMap.get(normalizeRelativePath(path)) ?? "";
}

function resolveDefinition(
  monaco: Monaco,
  model: editor.ITextModel,
  position: Position,
  ctx: GoToDefinitionContext,
): DefinitionTarget | null {
  const source = model.getValue();
  const imports = parseImports(source);
  const contentMap = buildFileContentMap(ctx.files);
  const filePaths = [...contentMap.keys()];

  // 1) Click on import module string → open the file.
  for (const item of imports) {
    if (
      position.lineNumber === item.moduleLine &&
      position.column >= item.moduleStartCol &&
      position.column <= item.moduleEndCol
    ) {
      const resolved = resolveImportPath(
        ctx.currentPath,
        item.module,
        filePaths,
      );
      if (!resolved) return null;
      return { path: resolved, line: 1, column: 1 };
    }
  }

  const word = model.getWordAtPosition(position);
  const wordName = word?.word ?? null;

  // 2) Click on an imported binding → jump to export in that module.
  if (wordName) {
    for (const item of imports) {
      const binding = item.bindings.get(wordName);
      if (!binding) continue;
      // Ensure cursor is on the binding, not somewhere else with same name.
      if (word) {
        const line = model.getLineContent(position.lineNumber);
        // Prefer when this line is part of an import, or when used as JSX/identifier elsewhere.
        const onImportLine =
          position.lineNumber <= item.moduleLine &&
          /^\s*import\b/.test(line);
        if (onImportLine || true) {
          const resolved = resolveImportPath(
            ctx.currentPath,
            item.module,
            filePaths,
          );
          if (!resolved) return null;
          const targetContent = readModelContent(monaco, resolved, contentMap);
          const loc = findSymbolInContent(
            targetContent,
            binding.isDefault ? null : binding.importedName,
            binding.isDefault,
          );
          return { path: resolved, ...loc };
        }
      }
    }
  }

  // 3) Click on a JSX component `<Foo` → resolve via import map.
  const jsxName = findJsxTagAtPosition(model, position) ?? (
    wordName && /^[A-Z]/.test(wordName) && !HTML_INTRINSICS.has(wordName.toLowerCase())
      ? wordName
      : null
  );

  if (jsxName) {
    const rootName = jsxName.split(".")[0] ?? jsxName;
    for (const item of imports) {
      const binding = item.bindings.get(rootName);
      if (!binding) continue;
      const resolved = resolveImportPath(
        ctx.currentPath,
        item.module,
        filePaths,
      );
      if (!resolved) return null;
      const targetContent = readModelContent(monaco, resolved, contentMap);
      const loc = findSymbolInContent(
        targetContent,
        binding.isDefault ? (jsxName.includes(".") ? null : rootName) : binding.importedName,
        binding.isDefault,
      );
      return { path: resolved, ...loc };
    }
  }

  return null;
}

function ensureDefinitionProviders(monaco: Monaco) {
  if (definitionProvidersRegistered) return;
  definitionProvidersRegistered = true;

  const provide = (
    model: editor.ITextModel,
    position: Position,
  ) => {
    // Context is attached per-model via WeakMap on URI string — set in registerGoToDefinition.
    const ctx = modelContexts.get(model.uri.toString());
    if (!ctx) return null;

    const target = resolveDefinition(monaco, model, position, ctx());
    if (!target) return null;

    return {
      uri: monaco.Uri.parse(monacoModelPath(target.path)),
      range: new monaco.Range(
        target.line,
        target.column,
        target.line,
        target.column,
      ),
    };
  };

  for (const language of ["typescript", "javascript"]) {
    monaco.languages.registerDefinitionProvider(language, {
      provideDefinition: provide,
    });
  }
}

const modelContexts = new Map<string, () => GoToDefinitionContext>();

/**
 * Enable ⌘/Ctrl-click and F12 Go to Definition for project imports / JSX components.
 */
export function registerGoToDefinition(
  monaco: Monaco,
  ed: editor.IStandaloneCodeEditor,
  getContext: () => GoToDefinitionContext | null,
): IDisposable {
  ensureEditorOpener(monaco);
  ensureDefinitionProviders(monaco);

  const model = ed.getModel();
  const uriKey = model?.uri.toString() ?? "";

  const wrappedGetContext = (): GoToDefinitionContext => {
    const ctx = getContext();
    if (!ctx) {
      return {
        currentPath: "",
        files: [],
        onNavigate: () => {},
      };
    }
    return ctx;
  };

  if (uriKey) {
    modelContexts.set(uriKey, wrappedGetContext);
  }

  navigators.set(ed, (target) => {
    const ctx = getContext();
    ctx?.onNavigate(target);
  });

  // Keep context URI in sync if the model is swapped.
  const modelDisposable = ed.onDidChangeModel((event) => {
    if (event.oldModelUrl) {
      modelContexts.delete(event.oldModelUrl.toString());
    }
    if (event.newModelUrl) {
      modelContexts.set(event.newModelUrl.toString(), wrappedGetContext);
    }
  });

  return {
    dispose: () => {
      modelDisposable.dispose();
      navigators.delete(ed);
      const current = ed.getModel()?.uri.toString();
      if (current) modelContexts.delete(current);
      if (uriKey) modelContexts.delete(uriKey);
    },
  };
}
