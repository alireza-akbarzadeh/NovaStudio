"use client";

import Editor, { loader, type OnMount } from "@monaco-editor/react";
import type { editor, IDisposable } from "monaco-editor";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { useExtensionsState } from "@/features/extensions/hooks/use-user-extensions";
import {
  activateExtensions,
  monacoThemeIdForActiveExtension,
  registerExtensionThemes,
} from "@/features/extensions/lib/activate";
import { VUE_EXTENSION_ID } from "@/features/extensions/lib/catalog";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import {
  monacoLanguageForPath,
  supportsAiSuggestion,
} from "@/features/workspace/lib/editor-languages";
import { registerActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { registerAiInlineCompletions } from "@/features/workspace/lib/monaco-ai-suggestion";
import { registerFormatAction } from "@/features/workspace/lib/monaco-format";
import {
  registerGoToDefinition,
  type DefinitionTarget,
  type GoToDefinitionContext,
} from "@/features/workspace/lib/monaco-go-to-definition";
import {
  configureMonacoLanguages,
  monacoModelPath,
} from "@/features/workspace/lib/monaco-languages";
import { registerJsxAutoCloseTags } from "@/features/workspace/lib/monaco-jsx-autoclose";
import { registerJsxSyntaxHighlight } from "@/features/workspace/lib/monaco-jsx-highlight";
import { buildMonacoOptions } from "@/features/workspace/lib/monaco-options";
import {
  POLARIS_THEME_DARK,
  POLARIS_THEME_LIGHT,
  registerNovaStudioThemes,
} from "@/features/workspace/lib/monaco-theme";
import type { ProjectFileEntry } from "@/features/workspace/lib/resolve-import-path";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

function fileNameFromPath(filePath: string) {
  const parts = filePath.split("/");
  return parts.at(-1) ?? filePath;
}

type CodeEditorProps = {
  value: string;
  filePath: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** When true, React does not own the document — Yjs / MonacoBinding does. */
  collaborative?: boolean;
  onCreateEditor?: (editor: editor.IStandaloneCodeEditor) => void;
  /** Project files used to resolve import / JSX go-to-definition. */
  definitionFiles?: ProjectFileEntry[];
  onGoToDefinition?: (target: DefinitionTarget) => void;
};

export function CodeEditor({
  value,
  filePath,
  onChange,
  readOnly = false,
  collaborative = false,
  onCreateEditor,
  definitionFiles,
  onGoToDefinition,
}: CodeEditorProps) {
  const fileName = fileNameFromPath(filePath);
  const { resolvedTheme } = useTheme();
  const { enabledIds, activeThemeId } = useExtensionsState();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<IDisposable[]>([]);
  const definitionFilesRef = useRef(definitionFiles);
  const onGoToDefinitionRef = useRef(onGoToDefinition);
  const filePathRef = useRef(filePath);
  definitionFilesRef.current = definitionFiles;
  onGoToDefinitionRef.current = onGoToDefinition;
  filePathRef.current = filePath;

  const pendingReveal = useWorkspaceStore((s) => s.pendingEditorReveal);
  const clearPendingEditorReveal = useWorkspaceStore(
    (s) => s.clearPendingEditorReveal,
  );

  const fontSize = useEditorSettingsStore((s) => s.fontSize);
  const tabSize = useEditorSettingsStore((s) => s.tabSize);
  const wordWrap = useEditorSettingsStore((s) => s.wordWrap);
  const lineNumbers = useEditorSettingsStore((s) => s.lineNumbers);
  const highlightActiveLine = useEditorSettingsStore(
    (s) => s.highlightActiveLine,
  );
  const bracketMatching = useEditorSettingsStore((s) => s.bracketMatching);
  const lineHeight = useEditorSettingsStore((s) => s.lineHeight);
  const monacoOverrides = useEditorSettingsStore((s) => s.monacoOverrides);

  const language = useMemo(
    () =>
      monacoLanguageForPath(filePath, {
        vueEnabled: enabledIds.has(VUE_EXTENSION_ID),
      }),
    [filePath, enabledIds],
  );

  // Keep model language in sync when Vue (or other packs) toggle after mount.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const model = ed.getModel();
    if (!model) return;
    let cancelled = false;
    void loader.init().then((monaco) => {
      if (cancelled) return;
      activateExtensions(monaco, enabledIds);
      if (model.getLanguageId() !== language) {
        monaco.editor.setModelLanguage(model, language);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [language, enabledIds]);

  const extensionTheme = monacoThemeIdForActiveExtension(activeThemeId);
  const theme =
    extensionTheme ?? (isDark ? POLARIS_THEME_DARK : POLARIS_THEME_LIGHT);

  const options = useMemo(
    () =>
      buildMonacoOptions(
        {
          fontSize,
          tabSize,
          wordWrap,
          lineNumbers,
          highlightActiveLine,
          bracketMatching,
          lineHeight,
        },
        readOnly,
        monacoOverrides,
      ),
    [
      bracketMatching,
      fontSize,
      highlightActiveLine,
      lineHeight,
      lineNumbers,
      monacoOverrides,
      readOnly,
      tabSize,
      wordWrap,
    ],
  );

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !pendingReveal || pendingReveal.path !== filePath) {
      return;
    }

    const model = ed.getModel();
    if (!model) return;
    if (model.getValueLength() === 0 && !value) return;

    const lineNumber = Math.min(
      Math.max(1, pendingReveal.line),
      model.getLineCount(),
    );
    const maxCol = model.getLineMaxColumn(lineNumber);
    const startCol = Math.min(Math.max(1, pendingReveal.column), maxCol);
    const endCol =
      pendingReveal.matchLength != null
        ? Math.min(startCol + pendingReveal.matchLength, maxCol)
        : startCol;

    ed.setSelection({
      startLineNumber: lineNumber,
      startColumn: startCol,
      endLineNumber: lineNumber,
      endColumn: endCol,
    });
    ed.revealPositionInCenter({ lineNumber, column: startCol });
    ed.focus();
    clearPendingEditorReveal();
  }, [clearPendingEditorReveal, filePath, pendingReveal, value]);

  useEffect(() => {
    return () => {
      for (const d of disposablesRef.current) d.dispose();
      disposablesRef.current = [];
    };
  }, []);

  const handleMount: OnMount = (ed, monaco) => {
    for (const d of disposablesRef.current) d.dispose();
    disposablesRef.current = [];

    registerNovaStudioThemes(monaco);
    registerExtensionThemes(monaco);
    activateExtensions(monaco, enabledIds);
    monaco.editor.setTheme(theme);
    configureMonacoLanguages(monaco);

    // Ensure model language + URI extension stay aligned for JSX/TSX/CSS.
    const model = ed.getModel();
    if (model && language) {
      monaco.editor.setModelLanguage(model, language);
    }

    if (!readOnly) {
      disposablesRef.current.push(
        registerFormatAction(ed, monaco, filePath, tabSize),
      );
    }

    disposablesRef.current.push({
      dispose: registerActiveMonacoEditor(filePath, ed),
    });

    if (!readOnly && supportsAiSuggestion(filePath)) {
      const ai = registerAiInlineCompletions(monaco, ed, filePath, fileName);
      if (ai) disposablesRef.current.push(ai);
    }

    // Monaco validates JSX but does not color tags — decorate .tsx/.jsx.
    const jsxHighlight = registerJsxSyntaxHighlight(monaco, ed, filePath);
    if (jsxHighlight) disposablesRef.current.push(jsxHighlight);

    const autoClose = registerJsxAutoCloseTags(ed, filePath);
    if (autoClose) disposablesRef.current.push(autoClose);

    disposablesRef.current.push(
      registerGoToDefinition(monaco, ed, (): GoToDefinitionContext | null => {
        const navigate = onGoToDefinitionRef.current;
        if (!navigate) return null;
        return {
          currentPath: filePathRef.current,
          files: definitionFilesRef.current ?? [],
          onNavigate: navigate,
        };
      }),
    );

    editorRef.current = ed;
    onCreateEditor?.(ed);
  };

  const modelPath = useMemo(() => monacoModelPath(filePath), [filePath]);

  return (
    <div className="polaris-monaco h-full min-h-0">
      <Editor
        height="100%"
        // file:///… keeps .tsx/.jsx/.css so Monaco enables JSX + CSS services.
        path={modelPath}
        language={language}
        theme={theme}
        value={collaborative ? undefined : value}
        onChange={
          collaborative
            ? undefined
            : (next) => {
                if (next == null) return;
                onChange?.(next);
              }
        }
        options={options}
        beforeMount={(monaco) => {
          registerNovaStudioThemes(monaco);
          registerExtensionThemes(monaco);
          activateExtensions(monaco, enabledIds);
          configureMonacoLanguages(monaco);
        }}
        onMount={handleMount}
        loading={
          <div className="flex h-full items-center justify-center bg-ws-bg text-[12px] text-ws-text-muted">
            Loading editor…
          </div>
        }
      />
    </div>
  );
}
