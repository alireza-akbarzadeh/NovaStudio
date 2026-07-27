"use client";

import { DiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useMemo, useSyncExternalStore } from "react";

import { useExtensionsState } from "@/features/extensions/hooks/use-user-extensions";
import {
  activateExtensions,
  monacoThemeIdForActiveExtension,
  registerExtensionThemes,
} from "@/features/extensions/lib/activate";
import { VUE_EXTENSION_ID } from "@/features/extensions/lib/catalog";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { monacoLanguageForPath } from "@/features/workspace/lib/editor-languages";
import {
  configureMonacoLanguages,
  monacoModelPath,
} from "@/features/workspace/lib/monaco-languages";
import { buildMonacoOptions } from "@/features/workspace/lib/monaco-options";
import { configureMonacoLoader } from "@/features/workspace/lib/monaco-loader";
import {
  POLARIS_THEME_DARK,
  POLARIS_THEME_LIGHT,
  registerNovaStudioThemes,
} from "@/features/workspace/lib/monaco-theme";

configureMonacoLoader();

type WorkspaceDiffEditorProps = {
  filePath: string;
  original: string;
  modified: string;
  renderSideBySide?: boolean;
  height?: number | string;
};

export function WorkspaceDiffEditor({
  filePath,
  original,
  modified,
  renderSideBySide = true,
  height = "100%",
}: WorkspaceDiffEditorProps) {
  const { resolvedTheme } = useTheme();
  const { enabledIds, activeThemeId } = useExtensionsState();
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

  const language = useMemo(
    () =>
      monacoLanguageForPath(filePath, {
        vueEnabled: enabledIds.has(VUE_EXTENSION_ID),
      }),
    [filePath, enabledIds],
  );

  const extensionTheme = monacoThemeIdForActiveExtension(activeThemeId);
  const theme =
    extensionTheme ?? (isDark ? POLARIS_THEME_DARK : POLARIS_THEME_LIGHT);

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
      renderSideBySide,
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
    renderSideBySide,
  ]);

  return (
    <DiffEditor
      height={height}
      language={language}
      original={original}
      modified={modified}
      originalModelPath={monacoModelPath(`diff-original/${filePath}`)}
      modifiedModelPath={monacoModelPath(`diff-modified/${filePath}`)}
      theme={theme}
      options={options}
      beforeMount={(monaco) => {
        registerNovaStudioThemes(monaco);
        registerExtensionThemes(monaco);
        activateExtensions(monaco, enabledIds);
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
