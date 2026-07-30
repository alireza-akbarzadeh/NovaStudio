import type { Monaco } from "@monaco-editor/react";

import { monacoLanguageForPath } from "@/features/workspace/lib/editor-languages";
import { monacoModelPath } from "@/features/workspace/lib/monaco-languages";
import type { ProjectFileEntry } from "@/features/workspace/lib/resolve-import-path";

const SCANNABLE = /\.(tsx?|jsx?|mjs|cjs)$/i;

/** Auxiliary definition models keyed by the active editor file path. */
const syncedDefinitionPaths = new Map<string, Set<string>>();

function disposeDefinitionModel(monaco: Monaco, path: string) {
  const uri = monaco.Uri.parse(monacoModelPath(path));
  const model = monaco.editor.getModel(uri);
  if (model && !model.isDisposed()) {
    model.dispose();
  }
}

/**
 * Keep lightweight read-only Monaco models for go-to-definition / peek targets.
 * Without these, peek definition opens an empty panel.
 */
export function syncDefinitionModels(
  monaco: Monaco,
  files: ProjectFileEntry[] | undefined,
  activePath: string,
): void {
  const wantedPaths = new Set<string>();

  if (files?.length) {
    for (const file of files) {
      if (!file.path || file.path === activePath) continue;
      if (!SCANNABLE.test(file.path)) continue;
      if (!file.content) continue;
      wantedPaths.add(file.path);
    }
  }

  const previous = syncedDefinitionPaths.get(activePath) ?? new Set<string>();
  for (const path of previous) {
    if (wantedPaths.has(path)) continue;
    disposeDefinitionModel(monaco, path);
  }

  if (!files?.length) {
    syncedDefinitionPaths.delete(activePath);
    return;
  }

  for (const file of files) {
    if (!file.path || file.path === activePath) continue;
    if (!SCANNABLE.test(file.path)) continue;

    const content = file.content ?? "";
    if (!content) continue;

    const uri = monaco.Uri.parse(monacoModelPath(file.path));
    const language = monacoLanguageForPath(file.path);

    let model = monaco.editor.getModel(uri);
    if (!model) {
      monaco.editor.createModel(content, language, uri);
      continue;
    }

    if (model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }

    if (model.getValue() !== content) {
      model.setValue(content);
    }
  }

  syncedDefinitionPaths.set(activePath, wantedPaths);
}

/** Drop auxiliary definition models when an editor tab unmounts. */
export function clearDefinitionModelsForFile(
  monaco: Monaco,
  activePath: string,
): void {
  const previous = syncedDefinitionPaths.get(activePath);
  if (!previous) return;
  for (const path of previous) {
    disposeDefinitionModel(monaco, path);
  }
  syncedDefinitionPaths.delete(activePath);
}

/** Drop all auxiliary definition models (e.g. when leaving the workspace). */
export function disposeAllDefinitionModels(monaco: Monaco): void {
  for (const paths of syncedDefinitionPaths.values()) {
    for (const path of paths) {
      disposeDefinitionModel(monaco, path);
    }
  }
  syncedDefinitionPaths.clear();
}
