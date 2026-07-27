"use client";

import { DiffEditor } from "@monaco-editor/react";
import { Loader2Icon, MessageSquarePlusIcon, XIcon } from "lucide-react";
import type { Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor, IDisposable, IRange } from "monaco-editor";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createRoot, type Root } from "react-dom/client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GitHubPullRequestReviewComment } from "@/features/github/hooks/use-github-pull-requests";
import {
  commentThreadZoneHeight,
  type ParsedUnifiedPatch,
} from "@/features/github/lib/parse-unified-patch";
import {
  GitHubAuthorAvatar,
  formatGitHubDate,
} from "@/features/github/components/github-hub-ui";
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

type PullRequestDiffReviewProps = {
  filePath: string;
  parsed: ParsedUnifiedPatch;
  reviewComments: GitHubPullRequestReviewComment[];
  canComment: boolean;
  isSubmitting: boolean;
  /** When true, the diff fills the parent flex container height. */
  fillHeight?: boolean;
  height?: number;
  onSubmitLineComment: (args: {
    line: number;
    body: string;
    suggestion?: string;
  }) => Promise<void>;
};

type LineThread = {
  editorLine: number;
  fileLine: number;
  comments: GitHubPullRequestReviewComment[];
};

function buildReviewCommentBody(comment: string, suggestion?: string) {
  const trimmed = comment.trim();
  const suggestionTrimmed = suggestion?.trim();
  if (!suggestionTrimmed) return trimmed;
  return `${trimmed}\n\n\`\`\`suggestion\n${suggestionTrimmed}\n\`\`\``;
}

function CommentThreadCard({
  comments,
  fileLine,
}: {
  comments: GitHubPullRequestReviewComment[];
  fileLine: number;
}) {
  return (
    <div className="rounded-md border border-sky-500/30 bg-[#161b22] p-3 shadow-sm">
      <p className="mb-2 text-[10px] font-medium tracking-wide text-sky-400 uppercase">
        Line {fileLine}
      </p>
      <ul className="space-y-3">
        {comments.map((comment) => (
          <li key={comment.id} className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ws-text-muted">
              <GitHubAuthorAvatar
                login={comment.authorLogin}
                avatarUrl={comment.authorAvatarUrl}
                size={18}
              />
              <span className="font-medium text-ws-text-secondary">
                {comment.authorLogin}
              </span>
              <span>{formatGitHubDate(comment.createdAt)}</span>
            </div>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ws-text-secondary">
              {comment.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InlineCommentComposer({
  fileLine,
  isSubmitting,
  onCancel,
  onSubmit,
}: {
  fileLine: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (body: string, suggestion?: string) => void;
}) {
  const [body, setBody] = useState("");
  const [suggestion, setSuggestion] = useState("");

  return (
    <div className="rounded-md border border-sky-500/40 bg-[#161b22] p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-sky-400">
          Comment on line {fileLine}
        </p>
        <button
          type="button"
          aria-label="Cancel comment"
          onClick={onCancel}
          className="inline-flex size-6 items-center justify-center rounded-md text-ws-text-muted hover:bg-ws-hover hover:text-ws-text"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Leave a review comment…"
        rows={3}
        autoFocus
        disabled={isSubmitting}
        className="mb-2 min-h-20 resize-none border-ws-border bg-ws-bg text-[13px] text-ws-text"
      />
      <Textarea
        value={suggestion}
        onChange={(event) => setSuggestion(event.target.value)}
        placeholder="Suggested change (optional)"
        rows={2}
        disabled={isSubmitting}
        className="mb-3 min-h-14 resize-none border-ws-border bg-ws-bg font-mono text-[12px] text-ws-text"
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isSubmitting}
          onClick={onCancel}
          className="h-8 border-ws-border bg-ws-bg text-[12px] text-ws-text hover:bg-ws-hover"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!body.trim() || isSubmitting}
          onClick={() => onSubmit(body, suggestion)}
          className="h-8 bg-sky-600 text-[12px] text-white hover:bg-sky-700"
        >
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-3.5 animate-spin" />
              Posting…
            </>
          ) : (
            "Add comment"
          )}
        </Button>
      </div>
    </div>
  );
}

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

  const diffEditorRef = useRef<MonacoEditor.IStandaloneDiffEditor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const zoneRootsRef = useRef<Map<string, Root>>(new Map());
  const zoneIdsRef = useRef<string[]>([]);
  const addWidgetRef = useRef<MonacoEditor.IContentWidget | null>(null);
  const disposablesRef = useRef<IDisposable[]>([]);
  const decorationsRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(
    null,
  );

  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [draftEditorLine, setDraftEditorLine] = useState<number | null>(null);

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

  const lineThreads = useMemo(() => {
    const byFileLine = new Map<number, GitHubPullRequestReviewComment[]>();
    for (const comment of reviewComments) {
      const bucket = byFileLine.get(comment.line) ?? [];
      bucket.push(comment);
      byFileLine.set(comment.line, bucket);
    }

    const threads: LineThread[] = [];
    for (const [fileLine, comments] of byFileLine) {
      const editorLine = parsed.fileLineToModifiedEditorLine.get(fileLine);
      if (!editorLine) continue;
      threads.push({ editorLine, fileLine, comments });
    }
    threads.sort((a, b) => a.editorLine - b.editorLine);
    return threads;
  }, [parsed.fileLineToModifiedEditorLine, reviewComments]);

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

  const clearViewZones = useCallback(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    diffEditor.getModifiedEditor().changeViewZones((accessor) => {
      for (const id of zoneIdsRef.current) {
        accessor.removeZone(id);
      }
    });
    zoneIdsRef.current = [];

    for (const root of zoneRootsRef.current.values()) {
      root.unmount();
    }
    zoneRootsRef.current.clear();
  }, []);

  const renderViewZones = useCallback(() => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    clearViewZones();

    const modifiedEditor = diffEditor.getModifiedEditor();
    const linesWithThreads = new Set(lineThreads.map((thread) => thread.editorLine));
    const draftFileLine =
      draftEditorLine !== null
        ? parsed.modifiedEditorLineToFileLine.get(draftEditorLine)
        : undefined;

    modifiedEditor.changeViewZones((accessor) => {
      for (const thread of lineThreads) {
        const hasComposer =
          draftEditorLine === thread.editorLine && draftFileLine !== undefined;
        const domNode = document.createElement("div");
        domNode.className = "px-3 py-1.5";
        const root = createRoot(domNode);
        zoneRootsRef.current.set(`thread-${thread.editorLine}`, root);

        root.render(
          <div className="space-y-2">
            <CommentThreadCard
              comments={thread.comments}
              fileLine={thread.fileLine}
            />
            {hasComposer ? (
              <InlineCommentComposer
                key={`composer-${thread.editorLine}`}
                fileLine={thread.fileLine}
                isSubmitting={isSubmitting}
                onCancel={() => setDraftEditorLine(null)}
                onSubmit={(body, suggestion) => {
                  void onSubmitLineComment({
                    line: thread.fileLine,
                    body,
                    suggestion,
                  }).then(() => setDraftEditorLine(null));
                }}
              />
            ) : null}
          </div>,
        );

        zoneIdsRef.current.push(
          accessor.addZone({
            afterLineNumber: thread.editorLine,
            heightInPx: commentThreadZoneHeight(
              thread.comments.length,
              hasComposer,
            ),
            domNode,
          }),
        );
      }

      if (
        draftEditorLine !== null &&
        draftFileLine !== undefined &&
        !linesWithThreads.has(draftEditorLine)
      ) {
        const domNode = document.createElement("div");
        domNode.className = "px-3 py-1.5";
        const root = createRoot(domNode);
        zoneRootsRef.current.set(`draft-${draftEditorLine}`, root);

        root.render(
          <InlineCommentComposer
            fileLine={draftFileLine}
            isSubmitting={isSubmitting}
            onCancel={() => setDraftEditorLine(null)}
            onSubmit={(body, suggestion) => {
              void onSubmitLineComment({
                line: draftFileLine,
                body,
                suggestion,
              }).then(() => setDraftEditorLine(null));
            }}
          />,
        );

        zoneIdsRef.current.push(
          accessor.addZone({
            afterLineNumber: draftEditorLine,
            heightInPx: commentThreadZoneHeight(0, true),
            domNode,
          }),
        );
      }
    });
  }, [
    clearViewZones,
    draftEditorLine,
    isSubmitting,
    lineThreads,
    onSubmitLineComment,
    parsed.modifiedEditorLineToFileLine,
  ]);

  useEffect(() => {
    renderViewZones();
  }, [renderViewZones]);

  useEffect(() => {
    if (!fillHeight) return;
    const container = editorContainerRef.current;
    if (!container) return;

    const relayout = () => {
      diffEditorRef.current?.layout();
    };

    const observer = new ResizeObserver(relayout);
    observer.observe(container);
    relayout();

    return () => observer.disconnect();
  }, [fillHeight, parsed.modified, parsed.original]);

  useEffect(() => {
    return () => {
      clearViewZones();
      for (const disposable of disposablesRef.current) {
        disposable.dispose();
      }
      disposablesRef.current = [];
    };
  }, [clearViewZones]);

  const updateLineDecorations = useCallback(
    (modifiedEditor: MonacoEditor.IStandaloneCodeEditor) => {
      decorationsRef.current?.clear();

      const decorationLines = new Set<number>();
      for (const thread of lineThreads) {
        decorationLines.add(thread.editorLine);
      }
      if (draftEditorLine !== null) decorationLines.add(draftEditorLine);
      if (hoveredLine !== null) decorationLines.add(hoveredLine);

      decorationsRef.current = modifiedEditor.createDecorationsCollection(
        [...decorationLines].map((line) => {
          const isDraft = line === draftEditorLine;
          const isHover = line === hoveredLine;
          const hasThread = lineThreads.some(
            (thread) => thread.editorLine === line,
          );

          let className = "";
          if (isDraft) className = "pr-review-line-draft";
          else if (isHover && canComment) className = "pr-review-line-hover";
          else if (hasThread) className = "pr-review-line-commented";

          const range: IRange = {
            startLineNumber: line,
            startColumn: 1,
            endLineNumber: line,
            endColumn: 1,
          };

          return {
            range,
            options: {
              isWholeLine: true,
              className,
              glyphMarginClassName: hasThread
                ? "pr-review-glyph-commented"
                : undefined,
            },
          };
        }),
      );
    },
    [canComment, draftEditorLine, hoveredLine, lineThreads],
  );

  const updateAddWidget = useCallback(
    (
      modifiedEditor: MonacoEditor.IStandaloneCodeEditor,
      monaco: Monaco,
      line: number | null,
    ) => {
      if (addWidgetRef.current) {
        modifiedEditor.removeContentWidget(addWidgetRef.current);
        addWidgetRef.current = null;
      }

      if (!canComment || line === null) return;

      const domNode = document.createElement("div");
      domNode.className = "pr-review-add-widget";
      domNode.innerHTML =
        '<button type="button" aria-label="Add comment" title="Add comment">+</button>';
      domNode.querySelector("button")?.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDraftEditorLine(line);
      });

      const widget: MonacoEditor.IContentWidget = {
        getId: () => "pr-review-add-widget",
        getDomNode: () => domNode,
        getPosition: () => ({
          position: { lineNumber: line, column: 1 },
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
        }),
      };

      modifiedEditor.addContentWidget(widget);
      addWidgetRef.current = widget;
    },
    [canComment],
  );

  const setupModifiedEditor = useCallback(
    (diffEditor: MonacoEditor.IStandaloneDiffEditor, monaco: Monaco) => {
      const modifiedEditor = diffEditor.getModifiedEditor();
      modifiedEditor.updateOptions({
        glyphMargin: true,
        lineDecorationsWidth: 12,
      });

      for (const disposable of disposablesRef.current) {
        disposable.dispose();
      }
      disposablesRef.current = [];

      disposablesRef.current.push(
        modifiedEditor.onMouseMove((event) => {
          const line = event.target.position?.lineNumber ?? null;
          if (
            line &&
            (event.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT ||
              event.target.type ===
                monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
              event.target.type ===
                monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS)
          ) {
            setHoveredLine(line);
          }
        }),
      );

      disposablesRef.current.push(
        modifiedEditor.onMouseDown((event) => {
          const line = event.target.position?.lineNumber;
          if (!line || !canComment) return;

          const isGlyph =
            event.target.type ===
            monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
          const isContent =
            event.target.type === monaco.editor.MouseTargetType.CONTENT_TEXT;

          if (isGlyph || isContent) {
            event.event.preventDefault();
            event.event.stopPropagation();
            setDraftEditorLine(line);
          }
        }),
      );

      disposablesRef.current.push(
        modifiedEditor.onDidScrollChange(() => {
          updateAddWidget(modifiedEditor, monaco, hoveredLine);
        }),
      );
    },
    [canComment, hoveredLine, updateAddWidget],
  );

  useEffect(() => {
    const diffEditor = diffEditorRef.current;
    const monaco = monacoRef.current;
    if (!diffEditor || !monaco) return;

    const modifiedEditor = diffEditor.getModifiedEditor();
    updateLineDecorations(modifiedEditor);
    updateAddWidget(modifiedEditor, monaco, hoveredLine);
  }, [hoveredLine, draftEditorLine, lineThreads, updateLineDecorations, updateAddWidget]);

  const editorHeight = fillHeight ? "100%" : height;

  return (
    <div className="pull-request-diff-review relative flex h-full min-h-0 flex-col">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .pull-request-diff-review .pr-review-line-hover {
          background-color: rgba(56, 139, 253, 0.12);
        }
        .pull-request-diff-review .pr-review-line-draft {
          background-color: rgba(56, 139, 253, 0.18);
        }
        .pull-request-diff-review .pr-review-line-commented {
          background-color: rgba(56, 139, 253, 0.08);
        }
        .pull-request-diff-review .pr-review-glyph-commented {
          background: rgba(56, 139, 253, 0.85);
          border-radius: 9999px;
          width: 8px !important;
          height: 8px !important;
          margin-left: 5px;
          margin-top: 6px;
        }
        .pull-request-diff-review .pr-review-add-widget {
          margin-left: 8px;
          z-index: 10;
        }
        .pull-request-diff-review .pr-review-add-widget button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1px solid rgba(56, 139, 253, 0.45);
          background: #1f6feb;
          color: white;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
        }
        .pull-request-diff-review .pr-review-add-widget button:hover {
          background: #388bfd;
        }
      `,
        }}
      />

      {canComment ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-ws-border/70 bg-ws-panel/40 px-3 py-1 text-[10px] text-ws-text-muted">
          <MessageSquarePlusIcon className="size-3 shrink-0 text-sky-400" />
          Click a line or + to comment inline
        </div>
      ) : null}

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
          monacoRef.current = monaco;
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
        onMount={(editor, monaco) => {
          diffEditorRef.current = editor;
          monacoRef.current = monaco;
          setupModifiedEditor(editor, monaco);
          renderViewZones();
          if (fillHeight) {
            editor.layout();
          }
        }}
      />
      </div>
    </div>
  );
}
