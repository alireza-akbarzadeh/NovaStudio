"use client";

import type { Monaco } from "@monaco-editor/react";
import type { editor as MonacoEditor, IDisposable, IRange } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildLineThreads } from "@/features/github/lib/pull-request/build-line-threads";
import type { LineThread } from "@/features/github/lib/pull-request/types";
import type { PullRequestDiffReviewProps } from "@/features/github/lib/pull-request/types";

type UsePullRequestDiffEditorArgs = Pick<
  PullRequestDiffReviewProps,
  "parsed" | "reviewComments" | "canComment" | "fillHeight" | "onSubmitLineComment"
>;

export function usePullRequestDiffEditor({
  parsed,
  reviewComments,
  canComment,
  fillHeight = false,
  onSubmitLineComment,
}: UsePullRequestDiffEditorArgs) {
  const diffEditorRef = useRef<MonacoEditor.IStandaloneDiffEditor | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const addWidgetRef = useRef<MonacoEditor.IContentWidget | null>(null);
  const disposablesRef = useRef<IDisposable[]>([]);
  const decorationsRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(
    null,
  );

  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [draftEditorLine, setDraftEditorLine] = useState<number | null>(null);
  const [activeThreadFileLine, setActiveThreadFileLine] = useState<number | null>(
    null,
  );
  const [draftBody, setDraftBody] = useState("");
  const [draftSuggestion, setDraftSuggestion] = useState("");

  const onSubmitLineCommentRef = useRef(onSubmitLineComment);
  onSubmitLineCommentRef.current = onSubmitLineComment;

  const draftFileLine =
    draftEditorLine !== null
      ? parsed.modifiedEditorLineToFileLine.get(draftEditorLine)
      : undefined;

  const lineThreads = useMemo(
    () => buildLineThreads(reviewComments, parsed),
    [parsed, reviewComments],
  );

  const threadByEditorLine = useMemo(() => {
    const map = new Map<number, LineThread>();
    for (const thread of lineThreads) {
      map.set(thread.editorLine, thread);
    }
    return map;
  }, [lineThreads]);

  const closeDraft = useCallback(() => {
    setDraftEditorLine(null);
    setDraftBody("");
    setDraftSuggestion("");
  }, []);

  const submitDraft = useCallback(async () => {
    if (!draftBody.trim() || draftFileLine === undefined) return;
    await onSubmitLineCommentRef.current({
      line: draftFileLine,
      body: draftBody,
      suggestion: draftSuggestion,
    });
    closeDraft();
  }, [closeDraft, draftBody, draftFileLine, draftSuggestion]);

  const revealEditorLine = useCallback((editorLine: number) => {
    const diffEditor = diffEditorRef.current;
    if (!diffEditor) return;

    const modifiedEditor = diffEditor.getModifiedEditor();
    modifiedEditor.revealLineInCenter(editorLine);
    modifiedEditor.setPosition({ lineNumber: editorLine, column: 1 });
    modifiedEditor.focus();
  }, []);

  const openDraft = useCallback(
    (editorLine: number) => {
      setActiveThreadFileLine(null);
      setDraftEditorLine(editorLine);
      setDraftBody("");
      setDraftSuggestion("");
      revealEditorLine(editorLine);
    },
    [revealEditorLine],
  );

  const selectThread = useCallback(
    (thread: LineThread) => {
      closeDraft();
      setActiveThreadFileLine(thread.fileLine);
      revealEditorLine(thread.editorLine);
    },
    [closeDraft, revealEditorLine],
  );

  const updateLineDecorations = useCallback(
    (modifiedEditor: MonacoEditor.IStandaloneCodeEditor) => {
      decorationsRef.current?.clear();

      const decorationLines = new Set<number>();
      for (const thread of lineThreads) {
        decorationLines.add(thread.editorLine);
      }
      if (draftEditorLine !== null) decorationLines.add(draftEditorLine);
      if (hoveredLine !== null) decorationLines.add(hoveredLine);

      const activeThread = lineThreads.find(
        (thread) => thread.fileLine === activeThreadFileLine,
      );

      decorationsRef.current = modifiedEditor.createDecorationsCollection(
        [...decorationLines].map((line) => {
          const isDraft = line === draftEditorLine;
          const isHover = line === hoveredLine;
          const hasThread = threadByEditorLine.has(line);
          const isActiveThread = activeThread?.editorLine === line;

          let className = "";
          if (isDraft) className = "pr-review-line-draft";
          else if (isActiveThread) className = "pr-review-line-active";
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
    [
      activeThreadFileLine,
      canComment,
      draftEditorLine,
      hoveredLine,
      lineThreads,
      threadByEditorLine,
    ],
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
        openDraft(line);
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
    [canComment, openDraft],
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

          if (!isGlyph && !isContent) return;

          event.event.preventDefault();
          event.event.stopPropagation();

          const existingThread = threadByEditorLine.get(line);
          if (existingThread) {
            selectThread(existingThread);
            return;
          }

          openDraft(line);
        }),
      );

      disposablesRef.current.push(
        modifiedEditor.onDidScrollChange(() => {
          updateAddWidget(modifiedEditor, monaco, hoveredLine);
        }),
      );
    },
    [canComment, hoveredLine, openDraft, selectThread, threadByEditorLine, updateAddWidget],
  );

  const onDiffEditorMount = useCallback(
    (editor: MonacoEditor.IStandaloneDiffEditor, monaco: Monaco) => {
      diffEditorRef.current = editor;
      monacoRef.current = monaco;
      setupModifiedEditor(editor, monaco);
      if (fillHeight) {
        editor.layout();
      }
    },
    [fillHeight, setupModifiedEditor],
  );

  const onMonacoBeforeMount = useCallback((monaco: Monaco) => {
    monacoRef.current = monaco;
  }, []);

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
      for (const disposable of disposablesRef.current) {
        disposable.dispose();
      }
      disposablesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const diffEditor = diffEditorRef.current;
    const monaco = monacoRef.current;
    if (!diffEditor || !monaco) return;

    const modifiedEditor = diffEditor.getModifiedEditor();
    updateLineDecorations(modifiedEditor);
    updateAddWidget(modifiedEditor, monaco, hoveredLine);
  }, [
    activeThreadFileLine,
    hoveredLine,
    draftEditorLine,
    lineThreads,
    updateLineDecorations,
    updateAddWidget,
  ]);

  return {
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
  };
}
