import type { Monaco } from "@monaco-editor/react";
import type { editor, Position } from "monaco-editor";

import {
  type DefinitionTarget,
  type GoToDefinitionContext,
  listImports,
  locateSymbolInContent,
  resolveSymbolDefinition,
} from "@/features/workspace/lib/monaco-go-to-definition";
import { monacoModelPath } from "@/features/workspace/lib/monaco-languages";
import {
  buildFileContentMap,
  resolveImportPath,
  type ProjectFileEntry,
} from "@/features/workspace/lib/resolve-import-path";

export type SymbolReference = {
  path: string;
  line: number;
  column: number;
  endColumn: number;
  kind: "definition" | "reference";
};

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
  return contentMap.get(path) ?? "";
}

function symbolNameAtDefinition(
  monaco: Monaco,
  definition: DefinitionTarget,
  contentMap: Map<string, string>,
  fallback: string,
): string {
  const content = readModelContent(monaco, definition.path, contentMap);
  const lines = content.split(/\r?\n/);
  const line = lines[definition.line - 1] ?? "";
  const word = line.slice(definition.column - 1).match(/^[A-Za-z_$][\w$]*/);
  return word?.[0] ?? fallback;
}

function collectSearchNames(args: {
  filePath: string;
  definitionPath: string;
  symbolName: string;
  content: string;
  filePaths: string[];
}): Set<string> {
  const names = new Set<string>();
  if (args.filePath === args.definitionPath) {
    names.add(args.symbolName);
  }

  for (const item of listImports(args.content)) {
    const resolved = resolveImportPath(
      args.filePath,
      item.module,
      args.filePaths,
    );
    if (resolved !== args.definitionPath) continue;

    for (const [localName, binding] of item.bindings) {
      if (binding.isDefault) {
        names.add(localName);
      } else if (
        binding.importedName === args.symbolName ||
        localName === args.symbolName
      ) {
        names.add(localName);
      }
    }
  }

  return names;
}

function appendOccurrences(
  refs: SymbolReference[],
  content: string,
  filePath: string,
  name: string,
  skip?: { path: string; line: number; column: number },
) {
  const lines = content.split(/\r?\n/);
  const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "g");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
      const column = match.index + 1;
      const lineNumber = i + 1;
      if (
        skip &&
        skip.path === filePath &&
        skip.line === lineNumber &&
        skip.column === column
      ) {
        continue;
      }
      refs.push({
        path: filePath,
        line: lineNumber,
        column,
        endColumn: column + name.length,
        kind: "reference",
      });
    }
  }
}

export function findSymbolReferences(
  monaco: Monaco,
  model: editor.ITextModel,
  position: Position,
  ctx: GoToDefinitionContext,
): SymbolReference[] {
  const word = model.getWordAtPosition(position);
  if (!word?.word) return [];

  const contentMap = buildFileContentMap(ctx.files);
  const filePaths = [...contentMap.keys()];

  let definition = resolveSymbolDefinition(monaco, model, position, ctx);
  if (!definition) {
    const local = locateSymbolInContent(model.getValue(), word.word, false);
    definition = { path: ctx.currentPath, ...local };
  }

  const symbolName = symbolNameAtDefinition(
    monaco,
    definition,
    contentMap,
    word.word,
  );

  const refs: SymbolReference[] = [
    {
      path: definition.path,
      line: definition.line,
      column: definition.column,
      endColumn: definition.column + symbolName.length,
      kind: "definition",
    },
  ];

  for (const filePath of filePaths) {
    const content = readModelContent(monaco, filePath, contentMap);
    const names = collectSearchNames({
      filePath,
      definitionPath: definition.path,
      symbolName,
      content,
      filePaths,
    });
    if (names.size === 0) continue;

    for (const name of names) {
      appendOccurrences(refs, content, filePath, name, {
        path: definition.path,
        line: definition.line,
        column: definition.column,
      });
    }
  }

  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = `${ref.path}:${ref.line}:${ref.column}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function applyRenameToFiles(
  files: ProjectFileEntry[],
  references: SymbolReference[],
  newName: string,
): Map<string, string> {
  if (!/^[A-Za-z_$][\w$]*$/.test(newName)) {
    throw new Error("Symbol name must be a valid identifier");
  }

  const byPath = new Map<string, SymbolReference[]>();
  for (const ref of references) {
    const list = byPath.get(ref.path) ?? [];
    list.push(ref);
    byPath.set(ref.path, list);
  }

  const contentMap = buildFileContentMap(files);
  const updates = new Map<string, string>();

  for (const [path, refs] of byPath) {
    const original = contentMap.get(path);
    if (original === undefined) continue;

    const lines = original.split(/\r?\n/);
    const sorted = [...refs].sort(
      (a, b) => b.line - a.line || b.column - a.column,
    );

    for (const ref of sorted) {
      const idx = ref.line - 1;
      const line = lines[idx] ?? "";
      lines[idx] =
        line.slice(0, ref.column - 1) + newName + line.slice(ref.endColumn - 1);
    }

    updates.set(path, lines.join("\n"));
  }

  return updates;
}
