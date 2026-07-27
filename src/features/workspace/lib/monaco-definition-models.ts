import type { Monaco } from "@monaco-editor/react";

import { monacoLanguageForPath } from "@/features/workspace/lib/editor-languages";
import { monacoModelPath } from "@/features/workspace/lib/monaco-languages";
import type { ProjectFileEntry } from "@/features/workspace/lib/resolve-import-path";

const SCANNABLE = /\.(tsx?|jsx?|mjs|cjs)$/i;

/**
 * Keep lightweight read-only Monaco models for go-to-definition / peek targets.
 * Without these, peek definition opens an empty panel.
 */
export function syncDefinitionModels(
  monaco: Monaco,
  files: ProjectFileEntry[] | undefined,
  activePath: string,
): void {
  if (!files?.length) return;

  for (const file of files) {
    if (!file.path || file.path === activePath) continue;
    if (!SCANNABLE.test(file.path)) continue;

    const uri = monaco.Uri.parse(monacoModelPath(file.path));
    const language = monacoLanguageForPath(file.path);
    const content = file.content ?? "";

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
}
