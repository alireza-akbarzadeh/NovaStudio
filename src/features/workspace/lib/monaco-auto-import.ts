import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, Position } from "monaco-editor";

import {
  buildAutoImportEdit,
  collectInScopeNames,
} from "@/features/workspace/lib/insert-import";
import {
  buildProjectExportIndex,
  type ProjectExport,
} from "@/features/workspace/lib/project-export-index";
import type { ProjectFileEntry } from "@/features/workspace/lib/resolve-import-path";

export type AutoImportContext = {
  currentPath: string;
  files: ProjectFileEntry[];
};

const modelContexts = new Map<string, () => AutoImportContext>();
let providersRegistered = false;

function isJsxTagContext(
  model: editor.ITextModel,
  position: Position,
): boolean {
  const line = model.getLineContent(position.lineNumber);
  const before = line.slice(0, position.column - 1);
  return /<[\s/A-Za-z_$-]*$/.test(before);
}

function completionPrefix(model: editor.ITextModel, position: Position): string {
  const word = model.getWordUntilPosition(position);
  if (word.word) return word.word;

  const line = model.getLineContent(position.lineNumber);
  const before = line.slice(0, position.column - 1);
  const jsxMatch = before.match(/<[\s/A-Za-z_$-]*$/);
  if (jsxMatch) {
    return jsxMatch[0].replace(/^.*</, "");
  }
  return word.word;
}

function wordReplaceRange(
  model: editor.ITextModel,
  position: Position,
): {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
} {
  const word = model.getWordUntilPosition(position);
  if (word.word) {
    return {
      startLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endLineNumber: position.lineNumber,
      endColumn: word.endColumn,
    };
  }

  const line = model.getLineContent(position.lineNumber);
  const before = line.slice(0, position.column - 1);
  const jsxMatch = before.match(/<[\s/A-Za-z_$-]*$/);
  if (jsxMatch) {
    const startColumn =
      position.column -
      jsxMatch[0].length +
      jsxMatch[0].lastIndexOf("<") +
      1;
    return {
      startLineNumber: position.lineNumber,
      startColumn: Math.max(1, startColumn),
      endLineNumber: position.lineNumber,
      endColumn: position.column,
    };
  }

  return {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  };
}

function rankExport(
  entry: ProjectExport,
  prefix: string,
  jsxContext: boolean,
): number {
  const lowerPrefix = prefix.toLowerCase();
  const lowerName = entry.name.toLowerCase();
  let score = 0;

  if (!prefix) score += 10;
  else if (lowerName === lowerPrefix) score += 100;
  else if (lowerName.startsWith(lowerPrefix)) score += 70;
  else if (lowerName.includes(lowerPrefix)) score += 30;
  else return 0;

  if (jsxContext && /^[A-Z]/.test(entry.name)) score += 15;
  if (entry.isDefault) score += 5;
  return score;
}

function ensureAutoImportProviders(monaco: Monaco) {
  if (providersRegistered) return;
  providersRegistered = true;

  const languages = ["typescript", "javascript"];

  for (const language of languages) {
    monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ["<", ".", "@", "/", '"', "'"],
      provideCompletionItems: (
        model: editor.ITextModel,
        position: Position,
      ) => {
        const ctx = modelContexts.get(model.uri.toString());
        if (!ctx) return { suggestions: [] };

        const { currentPath, files } = ctx();
        if (!currentPath || !/\.(tsx?|jsx?)$/i.test(currentPath)) {
          return { suggestions: [] };
        }

        const prefix = completionPrefix(model, position);
        if (prefix && !/^[A-Za-z_$][\w$-]*$/.test(prefix)) {
          return { suggestions: [] };
        }

        const jsxContext = isJsxTagContext(model, position);
        if (jsxContext && prefix && !/^[A-Z$_]/.test(prefix)) {
          return { suggestions: [] };
        }

        const source = model.getValue();
        const inScope = collectInScopeNames(source);
        const tsconfig =
          files.find((f) => f.path === "tsconfig.json")?.content ??
          files.find((f) => f.path === "jsconfig.json")?.content;

        const exports = buildProjectExportIndex(
          files.filter((file) => file.path !== currentPath),
        );

        const replaceRange = wordReplaceRange(model, position);
        const suggestions = exports
          .map((entry) => ({
            entry,
            score: rankExport(entry, prefix, jsxContext),
          }))
          .filter((row) => row.score > 0)
          .filter((row) => !inScope.has(row.entry.name))
          .sort(
            (a, b) =>
              b.score - a.score || a.entry.name.localeCompare(b.entry.name),
          )
          .slice(0, 30)
          .map(({ entry, score }, index) => {
            const importEdit = buildAutoImportEdit({
              sourceContent: source,
              fromPath: currentPath,
              exportEntry: entry,
              tsconfigContent: tsconfig,
            });

            const detailPath = entry.path.split("/").slice(-2).join("/");

            return {
              label: entry.name,
              kind: /^[A-Z]/.test(entry.name)
                ? monaco.languages.CompletionItemKind.Class
                : monaco.languages.CompletionItemKind.Function,
              detail: `Auto import from ${detailPath}`,
              insertText: entry.name,
              range: replaceRange,
              sortText: `${String(1000 - score).padStart(4, "0")}_${String(index).padStart(3, "0")}`,
              filterText: entry.name,
              additionalTextEdits: importEdit
                ? [
                    {
                      range: importEdit.range,
                      text: importEdit.text,
                    },
                  ]
                : undefined,
            };
          });

        return { suggestions };
      },
    });

    monaco.languages.registerCodeActionProvider(language, {
      provideCodeActions: (
        model: editor.ITextModel,
        range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number },
      ) => {
        const ctx = modelContexts.get(model.uri.toString());
        if (!ctx) return { actions: [], dispose: () => {} };

        const { currentPath, files } = ctx();
        if (!currentPath || !/\.(tsx?|jsx?)$/i.test(currentPath)) {
          return { actions: [], dispose: () => {} };
        }

        const word = model.getWordAtPosition({
          lineNumber: range.startLineNumber,
          column: range.startColumn,
        });
        if (!word?.word || !/^[A-Za-z_$][\w$]*$/.test(word.word)) {
          return { actions: [], dispose: () => {} };
        }

        const source = model.getValue();
        const inScope = collectInScopeNames(source);
        if (inScope.has(word.word)) {
          return { actions: [], dispose: () => {} };
        }

        const tsconfig =
          files.find((f) => f.path === "tsconfig.json")?.content ??
          files.find((f) => f.path === "jsconfig.json")?.content;

        const match = buildProjectExportIndex(
          files.filter((file) => file.path !== currentPath),
        ).find((entry) => entry.name === word.word);

        if (!match) {
          return { actions: [], dispose: () => {} };
        }

        const importEdit = buildAutoImportEdit({
          sourceContent: source,
          fromPath: currentPath,
          exportEntry: match,
          tsconfigContent: tsconfig,
        });

        if (!importEdit) {
          return { actions: [], dispose: () => {} };
        }

        return {
          actions: [
            {
              title: `Add import from '${match.path.split("/").pop() ?? match.path}'`,
              kind: "quickfix",
              isPreferred: true,
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    textEdit: {
                      range: importEdit.range,
                      text: importEdit.text,
                    },
                  },
                ],
              },
            },
          ],
          dispose: () => {},
        };
      },
    });
  }
}

/** VS Code-style auto-import completions for project exports. */
export function registerAutoImport(
  monaco: Monaco,
  ed: editor.IStandaloneCodeEditor,
  getContext: () => AutoImportContext | null,
): IDisposable {
  ensureAutoImportProviders(monaco);

  const model = ed.getModel();
  const uriKey = model?.uri.toString() ?? "";

  const wrappedGetContext = (): AutoImportContext => {
    const ctx = getContext();
    if (!ctx) {
      return { currentPath: "", files: [] };
    }
    return ctx;
  };

  if (uriKey) {
    modelContexts.set(uriKey, wrappedGetContext);
  }

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
      const current = ed.getModel()?.uri.toString();
      if (current) modelContexts.delete(current);
      if (uriKey) modelContexts.delete(uriKey);
    },
  };
}
