"use client";

import { DiffEditor } from "@monaco-editor/react";
import type { editor as MonacoEditor } from "monaco-editor";
import { useTheme } from "next-themes";
import { useMemo, useSyncExternalStore } from "react";

import { CommentThreadsPanel } from "@/features/github/components/pull-request/comment-threads-panel";
import { PullRequestDiffReviewHintBar } from "@/features/github/components/pull-request/diff-review-hint-bar";
import { PullRequestDiffReviewStyles } from "@/features/github/components/pull-request/diff-review-styles";
import { InlineCommentComposer } from "@/features/github/components/pull-request/inline-comment-composer";
import { usePullRequestDiffEditor } from "@/features/github/hooks/use-pull-request-diff-editor";
import type { PullRequestDiffReviewProps } from "@/features/github/lib/pull-request/types";
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
import { cn } from "@/lib/utils";

configureMonacoLoader();

/** GitHub-style diff with inline comment threads on lines. */
export function PullRequestDiffReview({
  filePath,
  parsed,
  reviewComments,
  canComment,
  isSubmitting,
  fillHeight = false,
  height = 480,
  onSubmitLineComment,
  onSubmitThreadReply,
}: PullRequestDiffReviewProps) {
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

  const {
    editorContainerRef,
    lineThreads,
    activeThreadFileLine,
    selectThread,
    draftEditorLine,
    draftFileLine,
    draftBody,
    draftSuggestion,
    setDraftBody,
    setDraftSuggestion,
    closeDraft,
    submitDraft,
    onDiffEditorMount,
    onMonacoBeforeMount,
  } = usePullRequestDiffEditor({
    parsed,
    reviewComments,
    canComment,
    fillHeight,
    onSubmitLineComment,
  });

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

  const options = useMemo((): MonacoEditor.IDiffEditorConstructionOptions => {
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
      minimap: { enabled: false },
      glyphMargin: true,
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

  const editorHeight = fillHeight ? "100%" : height;

  return (
    <div className="pull-request-diff-review relative flex h-full min-h-0 flex-col">
      <PullRequestDiffReviewStyles />
      {canComment ? <PullRequestDiffReviewHintBar /> : null}

      <div
        ref={editorContainerRef}
        className={cn("min-h-0", fillHeight ? "flex-1" : undefined)}
      >
        <DiffEditor
          height={editorHeight}
          language={language}
          original={parsed.original}
          modified={parsed.modified}
          originalModelPath={monacoModelPath(`pr-diff-original/${filePath}`)}
          modifiedModelPath={monacoModelPath(`pr-diff-modified/${filePath}`)}
          theme={theme}
          options={options}
          beforeMount={(monaco) => {
            onMonacoBeforeMount(monaco);
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
          onMount={onDiffEditorMount}
        />
      </div>

      <CommentThreadsPanel
        threads={lineThreads}
        activeFileLine={activeThreadFileLine}
        canComment={canComment}
        isSubmitting={isSubmitting}
        onSelectThread={selectThread}
        onSubmitThreadReply={onSubmitThreadReply}
      />

      {draftEditorLine !== null && draftFileLine !== undefined ? (
        <div className="relative z-20 shrink-0 border-t border-sky-500/30 bg-ws-panel px-3 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.35)]">
          <InlineCommentComposer
            fileLine={draftFileLine}
            body={draftBody}
            suggestion={draftSuggestion}
            isSubmitting={isSubmitting}
            onBodyChange={setDraftBody}
            onSuggestionChange={setDraftSuggestion}
            onCancel={closeDraft}
            onSubmit={() => void submitDraft()}
          />
        </div>
      ) : null}
    </div>
  );
}

export type { PullRequestDiffReviewProps } from "@/features/github/lib/pull-request/types";
