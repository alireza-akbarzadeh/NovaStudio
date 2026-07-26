/**
 * Liveblocks + Monaco collaborative editing session.
 *
 * Owns Yjs binding, draft/autosave, and Convex ↔ editor sync guards.
 * The React component is a thin view over this hook.
 */
"use client";

import { getYjsProviderForRoom } from "@liveblocks/yjs";
import type { editor } from "monaco-editor";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Awareness } from "y-protocols/awareness";
import * as Y from "yjs";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  replaceMonacoContentPreservingCursor,
  replaceYText,
} from "@/features/workspace/lib/collab-editor/content-ops";
import type {
  CollaborativeCodeEditorProps,
  CollaborativeEditorViewModel,
} from "@/features/workspace/lib/collab-editor/types";
import { softCollaboratorColor } from "@/features/workspace/lib/collab-cursor-theme";
import {
  loadFileContentDraft,
  pickAuthoritativeContent,
  saveFileContentDraft,
  shouldApplyExternalContent,
  shouldReseedLiveblocks,
} from "@/features/workspace/lib/file-content-drafts";
import {
  markFileDirty,
  registerFileSaveHandler,
} from "@/features/workspace/lib/file-save-controller";
import { runFormatDocument } from "@/features/workspace/lib/monaco-format";
import { MonacoBinding } from "@/features/workspace/lib/y-monaco-binding";
import { useEditorSettingsStore } from "@/features/settings/store/editor-settings-store";
import { useWorkspaceStore } from "@/features/workspace/store/workspace-store";
import { useRoom, useStatus, useUpdateMyPresence } from "@/liveblocks.config";

const SAVE_DEBOUNCE_MS = 800;
const EMPTY_RESEED_COOLDOWN_MS = 750;
const STALE_AUTOSAVE_GUARD_MS = 5000;
/** Block Yjs→Convex autosave until seed is applied (prevents stale room wipe). */
const AUTOSAVE_SEED_GRACE_MS = 1200;

export function useCollaborativeEditor({
  projectId,
  filePath,
  initialContent,
  serverUpdatedAt,
  readOnly = false,
  onContentChange,
  definitionFiles,
  onGoToDefinition,
}: CollaborativeCodeEditorProps): CollaborativeEditorViewModel {
  const room = useRoom();
  const status = useStatus();
  const updateMyPresence = useUpdateMyPresence();
  const updateContent = useMutation(api.projectFiles.updateContent);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingContentRef = useRef<string | null>(null);
  /** Bumped when AI/Convex content is applied so stale debounced saves are dropped. */
  const saveEpochRef = useRef(0);
  /** Last content we successfully persisted — used to ignore autosave echoes. */
  const lastSavedContentRef = useRef<string | null>(null);
  const seededRef = useRef(false);
  const initialContentRef = useRef(initialContent);
  const serverUpdatedAtRef = useRef(serverUpdatedAt);
  const onContentChangeRef = useRef(onContentChange);
  const readOnlyRef = useRef(readOnly);
  const acceptRemoteEditsRef = useRef(false);
  const applyingExternalRef = useRef(false);
  const lastEmptyReseedAtRef = useRef(0);
  const ytextRef = useRef<Y.Text | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);
  const persistToServerRef = useRef<
    (
      content: string,
      epoch: number,
      options?: { force?: boolean },
    ) => Promise<boolean>
  >(async () => false);
  const readyRef = useRef(false);
  /** False until Liveblocks has been seeded from Convex/draft — blocks wipe autosaves. */
  const autosaveAllowedRef = useRef(false);
  const autosaveGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const [ready, setReady] = useState(false);
  const [collabReady, setCollabReady] = useState(false);
  /**
   * After the first successful collab ready for this file, keep Monaco
   * uncontrolled across Liveblocks reconnects. Switching back to a controlled
   * React `value` makes monaco-react full-replace the model and drops typing.
   */
  const [keepUncontrolled, setKeepUncontrolled] = useState(false);
  const [value, setValue] = useState(initialContent);

  useEffect(() => {
    setKeepUncontrolled(false);
  }, [filePath, projectId]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    initialContentRef.current = initialContent;
    serverUpdatedAtRef.current = serverUpdatedAt;
    onContentChangeRef.current = onContentChange;
    readOnlyRef.current = readOnly;
  }, [initialContent, onContentChange, readOnly, serverUpdatedAt]);

  // Establish a clean baseline from Convex once per open (includes "").
  // Do not touch the dirty flag here — finishSetup / syncDirtyFlag own it.
  // Calling markFileDirty(false) raced with unsaved buffers after reconnect.
  useEffect(() => {
    if (lastSavedContentRef.current !== null) return;
    lastSavedContentRef.current = initialContent;
  }, [filePath, initialContent, projectId]);

  const knownContent = useCallback(
    () =>
      loadFileContentDraft(projectId, filePath)?.content ||
      initialContentRef.current ||
      value,
    [filePath, projectId, value],
  );

  const cancelPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingContentRef.current = null;
  }, []);

  const publishLocal = useCallback((text: string) => {
    setValue(text);
    onContentChangeRef.current?.(text);
  }, []);

  const syncDirtyFlag = useCallback(
    (content: string) => {
      const baseline = lastSavedContentRef.current ?? initialContentRef.current;
      markFileDirty(projectId, filePath, content !== baseline);
    },
    [filePath, projectId],
  );

  // ── Convex persistence ───────────────────────────────────────────────

  useEffect(() => {
    persistToServerRef.current = async (
      content: string,
      epoch: number,
      options?: { force?: boolean },
    ) => {
      if (epoch !== saveEpochRef.current) return false;

      const known =
        loadFileContentDraft(projectId, filePath)?.content ||
        initialContentRef.current ||
        value;
      // Never let an empty buffer wipe a known non-empty file (AI write / draft).
      if (!content && known) return false;

      // If draft is newer and differs, a stale autosave lost the race with AI.
      // Manual Save ({ force: true }) always writes the explicit buffer.
      if (!options?.force) {
        const draft = loadFileContentDraft(projectId, filePath);
        if (
          draft &&
          draft.content &&
          draft.content !== content &&
          Date.now() - draft.updatedAt < STALE_AUTOSAVE_GUARD_MS &&
          draft.content.length > content.length
        ) {
          return false;
        }
      }

      pendingContentRef.current = null;
      // Keep a durable local copy until the next successful load confirms Convex.
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

        // Keep Liveblocks room aligned with what we just persisted.
        // Never full-replace while the user is typing — delete+insert of the
        // whole doc makes the caret jump to line 1.
        const ytext = ytextRef.current;
        const ydoc = ydocRef.current;
        const ed = editorRef.current;
        if (
          ytext &&
          ydoc &&
          ytext.toString() !== content &&
          !ed?.hasTextFocus()
        ) {
          applyingExternalRef.current = true;
          try {
            replaceYText(ydoc, ytext, content);
            const model = ed?.getModel();
            if (ed && model && model.getValue() !== content) {
              replaceMonacoContentPreservingCursor(ed, model, content);
            }
          } catch (error) {
            console.warn("[collab] post-save Yjs sync failed", error);
          } finally {
            applyingExternalRef.current = false;
          }
        }

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
      const known = knownContent();
      if (!content && known) return;

      syncDirtyFlag(content);
      useWorkspaceStore.getState().promotePreviewTabByPath(filePath);
      pendingContentRef.current = content;

      if (!autosaveAllowedRef.current) return;
      if (!useEditorSettingsStore.getState().autoSave) return;

      const epoch = saveEpochRef.current;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void persistToServerRef.current(content, epoch);
      }, SAVE_DEBOUNCE_MS);
    },
    [filePath, knownContent, syncDirtyFlag],
  );

  const flushPendingSave = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (readOnlyRef.current) return false;

    const model = editorRef.current?.getModel();
    const fromEditor = model?.getValue();
    const fromYjs = ytextRef.current?.toString();
    const fromDraft = loadFileContentDraft(projectId, filePath)?.content;

    let content: string | null =
      fromEditor !== undefined
        ? fromEditor
        : (fromYjs ?? pendingContentRef.current ?? fromDraft ?? null);

    // Bind/seed race: Monaco briefly shows a truncated stale buffer while the
    // durable draft still has the full file — never flush the truncated one.
    if (
      content !== null &&
      fromDraft &&
      fromDraft.length > content.length &&
      (fromDraft.startsWith(content) || content.length === 0)
    ) {
      content = fromDraft;
    }

    if (content === null) return false;

    const known = knownContent();
    if (!content && known) {
      return persistToServerRef.current(known, saveEpochRef.current, {
        force: true,
      });
    }

    saveFileContentDraft(projectId, filePath, content);
    pendingContentRef.current = content;
    syncDirtyFlag(content);
    // Manual save must not be blocked by the stale-autosave guard.
    return persistToServerRef.current(content, saveEpochRef.current, {
      force: true,
    });
  }, [filePath, knownContent, projectId, syncDirtyFlag]);

  // Register for ⌘S / Save All
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

  // ── Monaco ↔ Yjs binding ─────────────────────────────────────────────

  const bindMonaco = useCallback((ed: editor.IStandaloneCodeEditor) => {
    const ytext = ytextRef.current;
    const awareness = awarenessRef.current;
    const model = ed.getModel();
    if (!ytext || !awareness || !model) return;
    // Already bound to this model — avoid destroy/recreate churn mid-typing.
    if (
      bindingRef.current &&
      bindingRef.current.monacoModel === model &&
      bindingRef.current.ytext === ytext
    ) {
      setCollabReady(true);
      setKeepUncontrolled(true);
      return;
    }

    // Suppress onChange/onText echoes from the binding's initial sync.
    applyingExternalRef.current = true;
    try {
      bindingRef.current?.destroy();
      bindingRef.current = new MonacoBinding(
        ytext,
        model,
        new Set([ed]),
        awareness,
      );
    } finally {
      applyingExternalRef.current = false;
    }
    setCollabReady(true);
    setKeepUncontrolled(true);
  }, []);

  /**
   * Apply Convex/AI content into the open editor without blanking the UI.
   * Prefer a Monaco model replace (y-monaco syncs safely) over raw Y.Text mutation.
   *
   * `asSaved: true` (default) means this buffer matches durable Convex — clear dirty.
   * Pass `asSaved: false` when restoring a local draft / resisting an empty Yjs pulse.
   */
  const applyExternalContent = useCallback(
    (next: string, options?: { asSaved?: boolean }) => {
      if (!next) return;
      if (applyingExternalRef.current) return;
      const asSaved = options?.asSaved !== false;

      const edFocused = editorRef.current;
      const currentY = ytextRef.current?.toString() ?? "";
      const currentEditor =
        edFocused?.getModel()?.getValue() ?? value;

      // Full-doc replace while typing always risks caret → (1,1). If the
      // focused buffer already matches (or is ahead), only sync metadata.
      if (
        edFocused?.hasTextFocus() &&
        currentEditor &&
        currentEditor !== next
      ) {
        // Intentional AI/server write stamped into the draft — still apply.
        const draft = loadFileContentDraft(projectId, filePath);
        if (!(draft && draft.content === next && asSaved)) {
          saveFileContentDraft(projectId, filePath, currentEditor);
          publishLocal(currentEditor);
          return;
        }
      }

      if (currentY === next || currentEditor === next) {
        saveFileContentDraft(projectId, filePath, next);
        if (asSaved) {
          lastSavedContentRef.current = next;
          markFileDirty(projectId, filePath, false);
        } else {
          syncDirtyFlag(next);
        }
        publishLocal(next);
        return;
      }

      applyingExternalRef.current = true;
      if (asSaved) {
        saveEpochRef.current += 1;
        cancelPendingSave();
      }
      saveFileContentDraft(projectId, filePath, next);
      if (asSaved) {
        lastSavedContentRef.current = next;
        markFileDirty(projectId, filePath, false);
      } else {
        pendingContentRef.current = next;
        syncDirtyFlag(next);
      }
      publishLocal(next);

      const ed = editorRef.current;
      const model = ed?.getModel();
      if (ed && model && readyRef.current) {
        try {
          replaceMonacoContentPreservingCursor(ed, model, next);
        } catch (error) {
          console.warn("[collab] Monaco external replace failed", error);
          const ytext = ytextRef.current;
          const ydoc = ydocRef.current;
          if (ytext && ydoc) {
            try {
              replaceYText(ydoc, ytext, next);
            } catch (yError) {
              console.warn("[collab] Y.Text external replace failed", yError);
            }
          }
        } finally {
          applyingExternalRef.current = false;
        }
        return;
      }

      // Collab not bound yet — mutate Y.Text directly, then bind.
      const ytext = ytextRef.current;
      const ydoc = ydocRef.current;
      if (ytext && ydoc) {
        try {
          replaceYText(ydoc, ytext, next);
        } catch (error) {
          console.warn("[collab] Y.Text seed/replace failed", error);
        }
      }
      applyingExternalRef.current = false;
    },
    [cancelPendingSave, filePath, projectId, publishLocal, syncDirtyFlag, value],
  );

  // ── Liveblocks room lifecycle ────────────────────────────────────────
  //
  // Important:
  // - Do NOT null `editorRef` (Monaco onMount is once-only).
  // - Treat "reconnecting" as still usable — tearing down on that blip
  //   destroys the Yjs bind mid-keystroke and is what made typing feel worse.
  const roomUsable = status === "connected" || status === "reconnecting";
  const roomId = room.id;

  useEffect(() => {
    if (!roomUsable) return;

    seededRef.current = false;
    acceptRemoteEditsRef.current = false;
    autosaveAllowedRef.current = false;
    if (autosaveGraceTimerRef.current) {
      clearTimeout(autosaveGraceTimerRef.current);
      autosaveGraceTimerRef.current = null;
    }
    bindingRef.current?.destroy();
    bindingRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional lifecycle reset
    setReady(false);
    setCollabReady(false);
    saveEpochRef.current += 1;
    cancelPendingSave();

    const provider = getYjsProviderForRoom(room);
    const ydoc = provider.getYDoc();
    // Keep the historical key so open Liveblocks rooms stay continuous.
    const ytext = ydoc.getText("codemirror");
    ytextRef.current = ytext;
    ydocRef.current = ydoc;
    awarenessRef.current = provider.awareness as unknown as Awareness;

    const self = room.getSelf();
    const userColor = self?.info?.color ?? "#90A4AE";
    const displayName = self?.info?.name?.trim() || "User";
    provider.awareness.setLocalStateField("user", {
      name: displayName.split(" ")[0] ?? displayName,
      color: userColor,
      colorLight: softCollaboratorColor(userColor),
    });

    let onSync: ((isSynced: boolean) => void) | null = null;
    let cancelled = false;

    const resolveSeed = () => {
      const draft = loadFileContentDraft(projectId, filePath);
      const monacoContent = editorRef.current?.getModel()?.getValue() ?? "";
      return pickAuthoritativeContent({
        serverContent: initialContentRef.current,
        ytextContent: ytext.toString(),
        draft,
        monacoContent,
      });
    };

    const seedIfNeeded = () => {
      if (seededRef.current) return;
      const seed = resolveSeed();
      const current = ytext.toString();
      if (shouldReseedLiveblocks(current, seed)) {
        try {
          replaceYText(ydoc, ytext, seed);
        } catch (error) {
          console.warn("[collab] seed failed", error);
        }
        if (seed) {
          saveFileContentDraft(projectId, filePath, seed);
        }
        // If the authoritative buffer is ahead of Convex (typed offline / fallback),
        // persist it once seed is done — after the autosave grace, via explicit flush.
        if (
          seed &&
          seed !== initialContentRef.current &&
          !readOnlyRef.current
        ) {
          pendingContentRef.current = seed;
        }
      }
      seededRef.current = true;
    };

    const finishSetup = () => {
      if (cancelled) return;
      seedIfNeeded();
      const text = ytext.toString() || resolveSeed();
      publishLocal(text);
      // Baseline is always the Convex copy; dirty when the live buffer differs.
      lastSavedContentRef.current =
        lastSavedContentRef.current ?? initialContentRef.current;
      if (text === initialContentRef.current) {
        lastSavedContentRef.current = text;
      }
      markFileDirty(projectId, filePath, text !== initialContentRef.current);
      if (text && text !== initialContentRef.current) {
        pendingContentRef.current = text;
        saveFileContentDraft(projectId, filePath, text);
      }
      acceptRemoteEditsRef.current = true;
      setReady(true);
      if (editorRef.current) {
        bindMonaco(editorRef.current);
      }

      // Allow autosave only after seed has settled — prevents stale Yjs wipe.
      autosaveGraceTimerRef.current = setTimeout(() => {
        autosaveGraceTimerRef.current = null;
        if (cancelled) return;
        autosaveAllowedRef.current = true;
        const pending = pendingContentRef.current;
        if (
          !pending ||
          pending === initialContentRef.current ||
          readOnlyRef.current
        ) {
          return;
        }
        // Keep dirty badge when auto-save is off; only flush if enabled.
        if (!useEditorSettingsStore.getState().autoSave) {
          markFileDirty(projectId, filePath, true);
          return;
        }
        void persistToServerRef.current(pending, saveEpochRef.current, {
          force: true,
        });
      }, AUTOSAVE_SEED_GRACE_MS);
    };

    const onText = () => {
      if (applyingExternalRef.current) return;

      const text = ytext.toString();
      const seed = resolveSeed();
      const known =
        loadFileContentDraft(projectId, filePath)?.content ||
        initialContentRef.current ||
        seed;

      // Empty Liveblocks pulse must never blank the UI or Convex after AI writes.
      if (!text && known) {
        if (!acceptRemoteEditsRef.current) return;
        // While typing, never full-replace — that jumps the caret to line 1.
        if (editorRef.current?.hasTextFocus()) {
          const live = editorRef.current.getModel()?.getValue() || known;
          publishLocal(live);
          return;
        }
        const now = Date.now();
        // Avoid a tight reseed loop if Y.Text keeps bouncing empty.
        if (now - lastEmptyReseedAtRef.current < EMPTY_RESEED_COOLDOWN_MS) {
          publishLocal(known);
          return;
        }
        lastEmptyReseedAtRef.current = now;
        // Restore buffer without claiming it was persisted to Convex.
        applyExternalContent(known, { asSaved: false });
        return;
      }

      if (!acceptRemoteEditsRef.current && !text && seed) return;

      // Before autosave is armed, never let a shorter Yjs buffer replace a
      // longer known Convex/draft buffer in the UI.
      if (
        !autosaveAllowedRef.current &&
        known &&
        text &&
        text.length < known.length &&
        known.startsWith(text)
      ) {
        publishLocal(known);
        return;
      }

      publishLocal(text);

      if (readOnlyRef.current) return;
      if (!text && known) return;

      saveFileContentDraft(projectId, filePath, text);
      scheduleServerSave(text);
    };

    ytext.observe(onText);

    if (provider.synced) {
      finishSetup();
    } else {
      onSync = (isSynced: boolean) => {
        if (!isSynced) return;
        if (onSync) provider.off("sync", onSync);
        finishSetup();
      };
      provider.on("sync", onSync);
    }

    const onPageHide = () => {
      void flushPendingSave();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flushPendingSave();
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      acceptRemoteEditsRef.current = false;
      autosaveAllowedRef.current = false;
      if (autosaveGraceTimerRef.current) {
        clearTimeout(autosaveGraceTimerRef.current);
        autosaveGraceTimerRef.current = null;
      }
      if (onSync) provider.off("sync", onSync);
      ytext.unobserve(onText);
      bindingRef.current?.destroy();
      bindingRef.current = null;
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      void flushPendingSave();
      ytextRef.current = null;
      ydocRef.current = null;
      awarenessRef.current = null;
      setReady(false);
      setCollabReady(false);
      // Keep editorRef + keepUncontrolled: Monaco stays mounted/uncontrolled
      // across brief Liveblocks gaps so typing is not wiped.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- room/file identity
  }, [filePath, projectId, roomId, roomUsable]);

  // Monaco onMount is once-only; if Liveblocks becomes ready after mount
  // (the common case), finishSetup may have missed editorRef — bind here.
  useEffect(() => {
    if (!ready) return;
    const ed = editorRef.current;
    if (!ed || bindingRef.current) return;
    bindMonaco(ed);
  }, [ready, bindMonaco, filePath, projectId]);

  // ── Convex/AI → open editor ──────────────────────────────────────────

  useEffect(() => {
    if (readOnly) return;
    if (!initialContent) return;

    const liveEditor = editorRef.current?.getModel()?.getValue();
    const current = liveEditor ?? ytextRef.current?.toString() ?? value;
    const draft = loadFileContentDraft(projectId, filePath);

    // Our own autosave echoing back while the user kept typing — ignore.
    if (
      lastSavedContentRef.current === initialContent &&
      current !== initialContent
    ) {
      return;
    }

    // Never clobber an actively focused editor whose buffer already moved on.
    if (
      editorRef.current?.hasTextFocus() &&
      current !== initialContent &&
      !(draft && draft.content === initialContent)
    ) {
      return;
    }

    if (
      !shouldApplyExternalContent({
        ytextContent: current,
        serverContent: initialContent,
        serverUpdatedAt,
        draft,
      })
    ) {
      // Recover UI if we somehow show empty while Convex/AI has content.
      if (!value && initialContent) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- recover empty buffer from server
        publishLocal(initialContent);
      }
      return;
    }

    applyExternalContent(initialContent);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- server buffer changes
  }, [
    filePath,
    initialContent,
    projectId,
    readOnly,
    serverUpdatedAt,
    status,
  ]);

  // ── Presence cursors ─────────────────────────────────────────────────

  useEffect(() => {
    if (!collabReady || readOnly) return;

    const publish = () => {
      const ed = editorRef.current;
      if (!ed) return;
      const sel = ed.getSelection();
      if (!sel) return;
      const model = ed.getModel();
      if (!model) return;
      const anchor = model.getOffsetAt({
        lineNumber: sel.positionLineNumber,
        column: sel.positionColumn,
      });
      const head = model.getOffsetAt({
        lineNumber: sel.selectionStartLineNumber,
        column: sel.selectionStartColumn,
      });
      updateMyPresence({
        cursor: { anchor, head },
      });
    };

    publish();
    const interval = window.setInterval(publish, 500);
    return () => window.clearInterval(interval);
  }, [collabReady, readOnly, updateMyPresence]);

  // ── View model ───────────────────────────────────────────────────────

  const reconnecting = status === "disconnected" || status === "reconnecting";
  const connecting =
    status === "connecting" || status === "initial" || !ready;
  const yjsBound = Boolean(bindingRef.current) && collabReady && ready;

  // Prefer live buffer, then durable draft, then Convex — never let an empty
  // pulse hide in-progress edits (especially on newly created files).
  const draftContent = loadFileContentDraft(projectId, filePath)?.content;
  const displayValue = value || draftContent || initialContent || "";

  const fallbackOnChange = readOnly
    ? undefined
    : (next: string) => {
        if (!next && knownContent()) return;
        // While Yjs owns the model (or bind is syncing), ignore React onChange.
        if (bindingRef.current || applyingExternalRef.current) return;
        publishLocal(next);
        saveFileContentDraft(projectId, filePath, next);
        scheduleServerSave(next);
      };

  const onCreateEditor = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      editorRef.current = ed;
      // Freeze uncontrolled mode immediately so later publishLocal/React
      // state updates cannot full-replace the model (caret → line 1).
      setKeepUncontrolled(true);
      if (ready) {
        bindMonaco(ed);
      }
    },
    [bindMonaco, ready],
  );

  return {
    displayValue,
    filePath,
    readOnly,
    collaborative: keepUncontrolled || ready,
    connecting,
    reconnecting,
    definitionFiles,
    onGoToDefinition,
    // Persist via onChange only when unbound (connecting / reconnect gap).
    onChange: yjsBound ? undefined : fallbackOnChange,
    onCreateEditor,
  };
}
