import type { Monaco } from "@monaco-editor/react";
import type { editor, IDisposable, Position } from "monaco-editor";

import {
  type GoToDefinitionContext,
  registerGoToDefinition,
} from "@/features/workspace/lib/monaco-go-to-definition";
import {
  findSymbolReferences,
  type SymbolReference,
} from "@/features/workspace/lib/symbol-refactor";

export type SymbolRefactorContext = GoToDefinitionContext & {
  onShowReferences: (refs: SymbolReference[], symbolName: string) => void;
  onRenameSymbol: (refs: SymbolReference[], symbolName: string) => void;
};

const modelContexts = new Map<string, () => SymbolRefactorContext>();
let referenceProvidersRegistered = false;

function ensureReferenceProviders(monaco: Monaco) {
  if (referenceProvidersRegistered) return;
  referenceProvidersRegistered = true;

  for (const language of [
    "typescript",
    "javascript",
    "typescriptreact",
    "javascriptreact",
  ]) {
    monaco.languages.registerReferenceProvider(language, {
      provideReferences: (model: editor.ITextModel, position: Position) => {
        const ctx = modelContexts.get(model.uri.toString());
        if (!ctx) return null;

        const word = model.getWordAtPosition(position);
        if (!word?.word) return null;

        const refs = findSymbolReferences(monaco, model, position, ctx());
        ctx().onShowReferences(refs, word.word);

        return refs.map((ref) => ({
          uri: monaco.Uri.parse(`file:///${ref.path}`),
          range: new monaco.Range(
            ref.line,
            ref.column,
            ref.line,
            ref.endColumn,
          ),
        }));
      },
    });
  }
}

/**
 * Find references (Shift+F12) + rename (F2) for project symbols.
 */
export function registerSymbolRefactor(
  monaco: Monaco,
  ed: editor.IStandaloneCodeEditor,
  getContext: () => SymbolRefactorContext | null,
): IDisposable {
  ensureReferenceProviders(monaco);

  const goToDef = registerGoToDefinition(monaco, ed, getContext);

  const model = ed.getModel();
  const uriKey = model?.uri.toString() ?? "";

  const wrappedGetContext = (): SymbolRefactorContext => {
    const ctx = getContext();
    if (!ctx) {
      return {
        currentPath: "",
        files: [],
        onNavigate: () => {},
        onShowReferences: () => {},
        onRenameSymbol: () => {},
      };
    }
    return ctx;
  };

  if (uriKey) {
    modelContexts.set(uriKey, wrappedGetContext);
  }

  const { KeyCode, KeyMod } = monaco;

  const findRefsAction = ed.addAction({
    id: "polaris.findReferences",
    label: "Find All References",
    keybindings: [KeyMod.Shift | KeyCode.F12],
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.4,
    run: (editorInstance) => {
      const ctx = getContext();
      const pos = editorInstance.getPosition();
      const word = pos
        ? editorInstance.getModel()?.getWordAtPosition(pos)
        : null;
      if (!ctx || !pos || !word?.word) return;
      const refs = findSymbolReferences(
        monaco,
        editorInstance.getModel()!,
        pos,
        ctx,
      );
      ctx.onShowReferences(refs, word.word);
    },
  });

  const renameAction = ed.addAction({
    id: "polaris.renameSymbol",
    label: "Rename Symbol",
    keybindings: [KeyCode.F2],
    contextMenuGroupId: "navigation",
    contextMenuOrder: 1.45,
    run: (editorInstance) => {
      const ctx = getContext();
      const pos = editorInstance.getPosition();
      const word = pos
        ? editorInstance.getModel()?.getWordAtPosition(pos)
        : null;
      if (!ctx || !pos || !word?.word) return;
      const refs = findSymbolReferences(
        monaco,
        editorInstance.getModel()!,
        pos,
        ctx,
      );
      ctx.onRenameSymbol(refs, word.word);
    },
  });

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
      goToDef.dispose();
      findRefsAction.dispose();
      renameAction.dispose();
      modelDisposable.dispose();
      const current = ed.getModel()?.uri.toString();
      if (current) modelContexts.delete(current);
      if (uriKey) modelContexts.delete(uriKey);
    },
  };
}
