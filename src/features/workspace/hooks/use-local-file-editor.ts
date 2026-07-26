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

export function useLocalFileEditor({
  projectId,
  filePath,
  initialContent,
  readOnly = false,
  onContentChange,
  definitionFiles,
  onGoToDefinition,
}: CollaborativeCodeEditorProps): CollaborativeEditorViewModel {
  const updateContent = useMutation(api.projectFiles.updateContent);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    initialContentRef.current = initialContent;
  }, [initialContent]);

  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  // Reset buffer only when switching files — not on every Convex autosave echo.
  useEffect(() => {
    const next =
      loadFileContentDraft(projectId, filePath)?.content ||
      initialContent ||
      "";
    setValue(next);
    lastSavedContentRef.current = initialContent || "";
    saveEpochRef.current += 1;
    pendingContentRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- file identity only
  }, [filePath, projectId]);

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

    setValue(initialContent);
    lastSavedContentRef.current = initialContent;
    saveEpochRef.current += 1;
    pendingContentRef.current = null;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    markFileDirty(projectId, filePath, false);
    onContentChangeRef.current?.(initialContent);
  }, [filePath, initialContent, projectId, readOnly]);

  const publishLocal = useCallback((content: string) => {
    setValue(content);
    onContentChangeRef.current?.(content);
  }, []);

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
  }, [filePath, projectId, syncDirtyFlag, value]);

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
    };
  }, []);

  const onChange = readOnly
    ? undefined
    : (next: string) => {
        if (!next && (initialContentRef.current || value)) return;
        publishLocal(next);
        saveFileContentDraft(projectId, filePath, next);
        scheduleServerSave(next);
      };

  const onCreateEditor = useCallback((ed: editor.IStandaloneCodeEditor) => {
    editorRef.current = ed;
  }, []);

  const draftContent = loadFileContentDraft(projectId, filePath)?.content;
  const displayValue = value || draftContent || initialContent || "";

  return {
    displayValue,
    filePath,
    readOnly,
    collaborative: false,
    connecting: false,
    reconnecting: false,
    definitionFiles,
    onGoToDefinition,
    onChange,
    onCreateEditor,
  };
}
