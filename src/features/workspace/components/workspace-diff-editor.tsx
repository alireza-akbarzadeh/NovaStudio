"use client";

import { DiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useMemo, useSyncExternalStore } from "react";

import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { monacoLanguageForPath } from "@/features/workspace/lib/editor-languages";
import {
  configureMonacoLanguages,
  monacoModelPath,
} from "@/features/workspace/lib/monaco-languages";
import { buildMonacoOptions } from "@/features/workspace/lib/monaco-options";
import {
  POLARIS_THEME_DARK,
  POLARIS_THEME_LIGHT,
  registerPolarisThemes,
} from "@/features/workspace/lib/monaco-theme";

type WorkspaceDiffEditorProps = {
  filePath: string;
  original: string;
  modified: string;
};

export function WorkspaceDiffEditor({
  filePath,
  original,
  modified,
}: WorkspaceDiffEditorProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = !mounted || (resolvedTheme ?? "dark") === "dark";

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

  const language = useMemo(() => monacoLanguageForPath(filePath), [filePath]);

  const options = useMemo((): editor.IDiffEditorConstructionOptions => {
    const base = buildMonacoOptions(
      {
        fontSize,
        tabSize,
        wordWrap,
        lineNumbers,
        highlightActiveLine,
        bracketMatching,
        lineHeight,
      },
      true,
      monacoOverrides,
    );

    return {
      ...base,
      readOnly: true,
      renderSideBySide: true,
      originalEditable: false,
      enableSplitViewResizing: true,
      renderIndicators: true,
      renderMarginRevertIcon: false,
      ignoreTrimWhitespace: false,
      // Diff chrome stays quiet — focus on the hunks.
      minimap: { enabled: false },
      glyphMargin: false,
      folding: false,
      stickyScroll: { enabled: false },
      scrollbar: {
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        useShadows: false,
      },
    };
  }, [
    fontSize,
    tabSize,
    wordWrap,
    lineNumbers,
    highlightActiveLine,
    bracketMatching,
    lineHeight,
    monacoOverrides,
  ]);

  return (
    <DiffEditor
      height="100%"
      language={language}
      original={original}
      modified={modified}
      originalModelPath={monacoModelPath(`diff-original/${filePath}`)}
      modifiedModelPath={monacoModelPath(`diff-modified/${filePath}`)}
      theme={isDark ? POLARIS_THEME_DARK : POLARIS_THEME_LIGHT}
      options={options}
      beforeMount={(monaco) => {
        registerPolarisThemes(monaco);
        configureMonacoLanguages(monaco);
      }}
      loading={
        <div className="flex h-full items-center justify-center text-[12px] text-ws-text-muted">
          Loading diff…
        </div>
      }
    />
  );
}
