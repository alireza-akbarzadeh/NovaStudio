/**
 * Local (non-Liveblocks) Monaco editing session with draft + Convex autosave.
 */
"use client";

import type { editor } from "monaco-editor";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  CollaborativeCodeEditorProps,
  CollaborativeEditorViewModel,
} from "@/features/workspace/lib/collab-editor/types";
import { replaceMonacoContentPreservingCursor } from "@/features/workspace/lib/collab-editor/content-ops";
import {
  loadFileContentDraft,
  saveFileContentDraft,
} from "@/features/workspace/lib/file-content-drafts";
import {
  markFileDirty,
  registerFileSaveHandler,
} from "@/features/workspace/lib/file-save-controller";
import { runFormatDocument } from "@/features/workspace/lib/monaco-format";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";

const SAVE_DEBOUNCE_MS = 800;
/** Avoid localStorage writes on every keystroke — they block the main thread. */
const DRAFT_DEBOUNCE_MS = 300;
/** Preview / import-index updates don't need to run on every keypress. */
const CONTENT_NOTIFY_DEBOUNCE_MS = 200;

export function useLocalFileEditor({
  projectId,
  filePath,
  initialContent,
  readOnly = false,
  onContentChange,
  definitionFiles,
  onGoToDefinition,
  onShowReferences,
  onRenameSymbol,
}: CollaborativeCodeEditorProps): CollaborativeEditorViewModel {
  const updateContent = useMutation(api.projectFiles.updateContent);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentNotifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const keepUncontrolledRef = useRef(false);
  const pendingContentRef = useRef<string | null>(null);
  const saveEpochRef = useRef(0);
  const lastSavedContentRef = useRef<string | null>(null);
  const initialContentRef = useRef(initialContent);
  const onContentChangeRef = useRef(onContentChange);
  const readOnlyRef = useRef(readOnly);
  const persistToServerRef = useRef<
    (content: string, epoch: number, options?: { force?: boolean }) => Promise<boolean>
  >(async () => false);

  const draft = loadFileContentDraft(projectId, filePath);
  const [value, setValue] = useState(
    () => draft?.content || initialContent || "",
  );
  /**
   * After mount, Monaco owns the buffer (uncontrolled). Controlled React
   * `value` full-replaces the model each keystroke and makes typing lag.
   */
  const [keepUncontrolled, setKeepUncontrolled] = useState(false);

  useEffect(() => {
    initialContentRef.current = initialContent;
  }, [initialContent]);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  const clearDraftTimer = useCallback(() => {
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = null;
    }
  }, []);

  const clearContentNotifyTimer = useCallback(() => {
    if (contentNotifyTimerRef.current) {
      clearTimeout(contentNotifyTimerRef.current);
      contentNotifyTimerRef.current = null;
    }
  }, []);

  const scheduleDraftSave = useCallback(
    (content: string) => {
      clearDraftTimer();
      draftTimerRef.current = setTimeout(() => {
        draftTimerRef.current = null;
        saveFileContentDraft(projectId, filePath, content);
      }, DRAFT_DEBOUNCE_MS);
    },
    [clearDraftTimer, filePath, projectId],
  );

  const scheduleContentNotify = useCallback(
    (content: string) => {
      clearContentNotifyTimer();
      contentNotifyTimerRef.current = setTimeout(() => {
        contentNotifyTimerRef.current = null;
        onContentChangeRef.current?.(content);
      }, CONTENT_NOTIFY_DEBOUNCE_MS);
    },
    [clearContentNotifyTimer],
  );

  const publishLocal = useCallback(
    (content: string) => {
      if (!keepUncontrolledRef.current) {
        setValue(content);
      }
      scheduleContentNotify(content);
    },
    [scheduleContentNotify],
  );

  // Reset buffer only when switching files — not on every Convex autosave echo.
  useEffect(() => {
    const next =
      loadFileContentDraft(projectId, filePath)?.content ||
      initialContent ||
      "";
    setValue(next);
    keepUncontrolledRef.current = false;
    setKeepUncontrolled(false);
    lastSavedContentRef.current = initialContent || "";
    saveEpochRef.current += 1;
    pendingContentRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    clearDraftTimer();
    clearContentNotifyTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- file identity only
  }, [clearContentNotifyTimer, clearDraftTimer, filePath, projectId]);

  // Apply remote Convex writes (AI / other device) without clobbering local typing.
  useEffect(() => {
    if (readOnly) return;
    if (!initialContent) return;

    const live =
      editorRef.current?.getModel()?.getValue() ??
      loadFileContentDraft(projectId, filePath)?.content ??
      lastSavedContentRef.current ??
      "";

    // Own autosave echoing back while the user kept typing.
    if (
      lastSavedContentRef.current === initialContent &&
      live !== initialContent
    ) {
      return;
    }

    if (live === initialContent) {
      lastSavedContentRef.current = initialContent;
      return;
    }

    // Focused editor with local edits ahead of server — keep local.
    if (editorRef.current?.hasTextFocus() && live !== initialContent) {
      return;
    }

    const ed = editorRef.current;
    const model = ed?.getModel();
    if (ed && model && keepUncontrolledRef.current) {
      replaceMonacoContentPreservingCursor(ed, model, initialContent);
    } else {
      setValue(initialContent);
    }
    lastSavedContentRef.current = initialContent;
    saveEpochRef.current += 1;
    pendingContentRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    clearDraftTimer();
    clearContentNotifyTimer();
    saveFileContentDraft(projectId, filePath, initialContent);
    markFileDirty(projectId, filePath, false);
    onContentChangeRef.current?.(initialContent);
  }, [
    clearContentNotifyTimer,
    clearDraftTimer,
    filePath,
    initialContent,
    projectId,
    readOnly,
  ]);

  const syncDirtyFlag = useCallback(
    (content: string) => {
      const baseline = lastSavedContentRef.current ?? initialContentRef.current;
      markFileDirty(projectId, filePath, content !== baseline);
    },
    [filePath, projectId],
  );

  useEffect(() => {
    persistToServerRef.current = async (content, epoch) => {
      if (epoch !== saveEpochRef.current) return false;
      if (!content && (initialContentRef.current || value)) return false;

      pendingContentRef.current = null;
      saveFileContentDraft(projectId, filePath, content);

      try {
        await updateContent({
          projectId: projectId as Id<"projects">,
          path: filePath,
          content,
        });
        if (epoch !== saveEpochRef.current) return false;
        lastSavedContentRef.current = content;
        markFileDirty(projectId, filePath, false);
        return true;
      } catch {
        if (epoch !== saveEpochRef.current) return false;
        saveFileContentDraft(projectId, filePath, content);
        markFileDirty(projectId, filePath, true);
        return false;
      }
    };
  }, [filePath, projectId, updateContent, value]);

  const scheduleServerSave = useCallback(
    (content: string) => {
      if (!content && (initialContentRef.current || value)) return;
      syncDirtyFlag(content);
      useWorkspaceStore.getState().promotePreviewTabByPath(filePath);
      pendingContentRef.current = content;
      if (!useEditorSettingsStore.getState().autoSave) return;

      const epoch = saveEpochRef.current;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void persistToServerRef.current(content, epoch);
      }, SAVE_DEBOUNCE_MS);
    },
    [filePath, syncDirtyFlag, value],
  );

  const flushPendingSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    clearDraftTimer();
    clearContentNotifyTimer();
    if (readOnlyRef.current) return false;

    const fromEditor = editorRef.current?.getModel()?.getValue();
    const fromDraft = loadFileContentDraft(projectId, filePath)?.content;
    const content =
      fromEditor ?? pendingContentRef.current ?? fromDraft ?? value;
    if (!content && initialContentRef.current) return false;

    saveFileContentDraft(projectId, filePath, content);
    pendingContentRef.current = content;
    syncDirtyFlag(content);
    return persistToServerRef.current(content, saveEpochRef.current, {
      force: true,
    });
  }, [
    clearContentNotifyTimer,
    clearDraftTimer,
    filePath,
    projectId,
    syncDirtyFlag,
    value,
  ]);

  useEffect(() => {
    if (readOnly) return;
    return registerFileSaveHandler({
      projectId,
      path: filePath,
      flush: () => flushPendingSave(),
      format: async () => {
        const ed = editorRef.current;
        if (!ed) return false;
        const tabSize = useEditorSettingsStore.getState().tabSize;
        return runFormatDocument(ed, filePath, tabSize);
      },
    });
  }, [filePath, flushPendingSave, projectId, readOnly]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      clearDraftTimer();
      clearContentNotifyTimer();
    };
  }, [clearContentNotifyTimer, clearDraftTimer]);

  const onChange = readOnly
    ? undefined
    : (next: string) => {
        if (!next && (initialContentRef.current || value)) return;
        publishLocal(next);
        scheduleDraftSave(next);
        scheduleServerSave(next);
      };

  const onCreateEditor = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
    keepUncontrolledRef.current = true;
    setKeepUncontrolled(true);
  }, []);

  const draftContent = loadFileContentDraft(projectId, filePath)?.content;
  const displayValue = value || draftContent || initialContent || "";

  return {
    displayValue,
    filePath,
    readOnly,
    collaborative: keepUncontrolled,
    connecting: false,
    reconnecting: false,
    definitionFiles,
    onGoToDefinition,
    onShowReferences,
    onRenameSymbol,
    onChange,
    onCreateEditor,
  };
}
