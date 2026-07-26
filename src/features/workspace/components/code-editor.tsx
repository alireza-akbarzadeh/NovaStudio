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
import { LanguageSupportBanner } from "@/features/workspace/components/language-support-banner";
import { registerActiveMonacoEditor } from "@/features/workspace/lib/active-monaco-editor";
import { resolveSafeMonacoLanguage } from "@/features/workspace/lib/language-support";
import { registerAiInlineCompletions } from "@/features/workspace/lib/monaco-ai-suggestion";
import { registerFormatAction } from "@/features/workspace/lib/monaco-format";
import { registerInlineAiEdit } from "@/features/workspace/lib/monaco-inline-ai-edit";
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
import { configureMonacoLoader } from "@/features/workspace/lib/monaco-loader";
import { buildMonacoOptions } from "@/features/workspace/lib/monaco-options";
import {
  POLARIS_THEME_DARK,
  POLARIS_THEME_LIGHT,
  registerNovaStudioThemes,
} from "@/features/workspace/lib/monaco-theme";
import type { ProjectFileEntry } from "@/features/workspace/lib/resolve-import-path";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

configureMonacoLoader();

function EditorLoadingFallback({ value }: { value: string }) {
  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-ws-bg">
      <pre
        aria-hidden
        className="pointer-events-none h-full overflow-hidden p-4 font-mono text-[12px] leading-5 whitespace-pre-wrap text-ws-text-secondary/70"
      >
        {value || " "}
      </pre>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ws-bg to-transparent" />
      <div className="pointer-events-none absolute right-3 bottom-3 rounded-md bg-ws-panel/90 px-2 py-1 text-[10px] text-ws-text-muted">
        Loading editor…
      </div>
    </div>
  );
}

function fileNameFromPath(filePath: string) {
  const parts = filePath.split("/");
  return parts.at(-1) ?? filePath;
}

function safeConfigureMonaco(
  monaco: Parameters<OnMount>[1],
  enabledIds: ReadonlySet<string>,
) {
  try {
    registerNovaStudioThemes(monaco);
    registerExtensionThemes(monaco);
    activateExtensions(monaco, enabledIds);
    configureMonacoLanguages(monaco);
  } catch (error) {
    console.warn("[editor] language/theme setup failed", error);
  }
}

function safeSetModelLanguage(
  monaco: Parameters<OnMount>[1],
  model: editor.ITextModel | null,
  requested: string,
) {
  if (!model) return;
  try {
    const language = resolveSafeMonacoLanguage(monaco, requested);
    if (model.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(model, language);
    }
  } catch (error) {
    console.warn("[editor] setModelLanguage failed; using plaintext", error);
    try {
      monaco.editor.setModelLanguage(model, "plaintext");
    } catch {
      // ignore — model may already be disposed
    }
  }
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
      try {
        activateExtensions(monaco, enabledIds);
      } catch (error) {
        console.warn("[editor] extension activate failed", error);
      }
      safeSetModelLanguage(monaco, model, language);
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

    try {
      safeConfigureMonaco(monaco, enabledIds);
      monaco.editor.setTheme(theme);

      // Ensure model language + URI extension stay aligned for JSX/TSX/CSS.
      safeSetModelLanguage(monaco, ed.getModel(), language);

      if (!readOnly) {
        disposablesRef.current.push(
          registerFormatAction(ed, monaco, filePath, tabSize),
        );
      }

      disposablesRef.current.push({
        dispose: registerActiveMonacoEditor(filePath, ed),
      });

      if (!readOnly && supportsAiSuggestion(filePath)) {
        try {
          const ai = registerAiInlineCompletions(monaco, ed, filePath, fileName);
          if (ai) disposablesRef.current.push(ai);
        } catch (error) {
          console.warn("[editor] AI completions unavailable", error);
        }

        try {
          const inlineEdit = registerInlineAiEdit(monaco, ed, filePath);
          if (inlineEdit) disposablesRef.current.push(inlineEdit);
        } catch (error) {
          console.warn("[editor] inline AI edit unavailable", error);
        }
      }

      // Monaco validates JSX but does not color tags — decorate .tsx/.jsx.
      try {
        const jsxHighlight = registerJsxSyntaxHighlight(monaco, ed, filePath);
        if (jsxHighlight) disposablesRef.current.push(jsxHighlight);
      } catch (error) {
        console.warn("[editor] JSX highlight unavailable", error);
      }

      try {
        const autoClose = registerJsxAutoCloseTags(ed, filePath);
        if (autoClose) disposablesRef.current.push(autoClose);
      } catch (error) {
        console.warn("[editor] JSX autoclose unavailable", error);
      }

      try {
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
      } catch (error) {
        console.warn("[editor] go-to-definition unavailable", error);
      }

      editorRef.current = ed;
      onCreateEditor?.(ed);
    } catch (error) {
      console.error("[editor] mount failed", error);
      editorRef.current = ed;
      onCreateEditor?.(ed);
    }
  };

  const modelPath = useMemo(() => monacoModelPath(filePath), [filePath]);

  return (
    <div className="polaris-monaco flex h-full min-h-0 flex-col">
      <LanguageSupportBanner languageId={language} />
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          // file:///… keeps .tsx/.jsx/.css so Monaco enables JSX + CSS services.
          path={modelPath}
          language={language}
          theme={theme}
          // When collaborative, never pass controlled `value` — monaco-react
          // full-replaces the model on each update and fights Yjs/Liveblocks.
          value={collaborative ? undefined : value}
          onChange={
            collaborative
              ? onChange
                ? (next) => {
                    // Uncontrolled + onChange: persist during reconnect without
                    // letting React own the buffer.
                    if (next == null) return;
                    onChange(next);
                  }
                : undefined
              : (next) => {
                  if (next == null) return;
                  onChange?.(next);
                }
          }
          options={options}
          beforeMount={(monaco) => {
            safeConfigureMonaco(monaco, enabledIds);
          }}
          onMount={handleMount}
          loading={<EditorLoadingFallback value={value} />}
        />
      </div>
    </div>
  );
}
