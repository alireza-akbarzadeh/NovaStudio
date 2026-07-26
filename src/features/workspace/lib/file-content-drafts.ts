/** Local draft buffer so editor content survives refresh before Convex autosave. */

const STORAGE_PREFIX = "polaris-file-draft:";

/** Session memory — survives tab remounts even if localStorage draft was cleared. */
const memoryDrafts = new Map<string, FileContentDraft>();

export type FileContentDraft = {
  content: string;
  updatedAt: number;
};

function storageKey(projectId: string, path: string) {
  return `${STORAGE_PREFIX}${projectId}:${path}`;
}

function memoryKey(projectId: string, path: string) {
  return `${projectId}:${path}`;
}

export function loadFileContentDraft(
  projectId: string,
  path: string,
): FileContentDraft | null {
  const mem = memoryDrafts.get(memoryKey(projectId, path));
  if (typeof window === "undefined") return mem ?? null;

  try {
    const raw = localStorage.getItem(storageKey(projectId, path));
    if (!raw) return mem ?? null;
    const parsed = JSON.parse(raw) as FileContentDraft;
    if (
      typeof parsed?.content !== "string" ||
      typeof parsed?.updatedAt !== "number"
    ) {
      return mem ?? null;
    }
    // Prefer whichever draft is newer.
    if (mem && mem.updatedAt > parsed.updatedAt) return mem;
    memoryDrafts.set(memoryKey(projectId, path), parsed);
    return parsed;
  } catch {
    return mem ?? null;
  }
}

export function saveFileContentDraft(
  projectId: string,
  path: string,
  content: string,
) {
  // Never let an empty pulse erase a known non-empty draft.
  const existing = loadFileContentDraft(projectId, path);
  if (!content && existing?.content) {
    return;
  }

  const draft: FileContentDraft = {
    content,
    updatedAt: Date.now(),
  };
  memoryDrafts.set(memoryKey(projectId, path), draft);

  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(storageKey(projectId, path), JSON.stringify(draft));
  } catch {
    // Quota / private mode — memory + Convex autosave remain the durable path.
  }
}

export function clearFileContentDraft(
  projectId: string,
  path: string,
  options?: { keepMemory?: boolean },
) {
  if (!options?.keepMemory) {
    memoryDrafts.delete(memoryKey(projectId, path));
  }
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(projectId, path));
  } catch {
    // ignore
  }
}

/**
 * Prefer a local draft when it differs from the server copy.
 *
 * IMPORTANT: do NOT prefer server solely because `serverUpdatedAt` is newer.
 * Autosave echoes often land with a newer timestamp than subsequent keystrokes,
 * and that used to rewind the open editor (cursor jump + dropped characters).
 */
export function resolveSeedContent(
  serverContent: string,
  _serverUpdatedAt: number | undefined,
  draft: FileContentDraft | null,
): string {
  if (!draft) return serverContent;

  if (draft.content === serverContent) {
    return serverContent;
  }

  // Empty Liveblocks/draft pulse must not beat a real Convex/AI write.
  if (!draft.content && serverContent) {
    return serverContent;
  }

  // Non-empty differing draft = in-progress local/AI buffer. Keep it.
  if (draft.content) {
    return draft.content;
  }

  return serverContent;
}

/**
 * Pick what should win when Convex, Liveblocks, Monaco, and drafts disagree.
 *
 * This is the core fix for “I saved, refreshed, and my file was wiped”:
 * a stale non-empty Liveblocks room used to beat Convex, then autosave wrote
 * that stale buffer back to Convex.
 */
export function pickAuthoritativeContent(args: {
  serverContent: string;
  ytextContent: string;
  draft: FileContentDraft | null;
  monacoContent?: string;
}): string {
  const {
    serverContent,
    ytextContent,
    draft,
    monacoContent = "",
  } = args;

  // Unsaved local draft that diverged from Convex — never discard it.
  if (draft?.content && draft.content !== serverContent) {
    return draft.content;
  }

  // Live Monaco buffer ahead of both (typed while collab was still connecting).
  if (
    monacoContent &&
    monacoContent !== serverContent &&
    monacoContent !== ytextContent &&
    monacoContent.length >= Math.max(serverContent.length, ytextContent.length)
  ) {
    return monacoContent;
  }

  // Draft matches server (or no draft): durable Convex copy vs Liveblocks room.
  if (!ytextContent) return serverContent || monacoContent;
  if (!serverContent) return ytextContent || monacoContent;
  if (ytextContent === serverContent) return serverContent;

  // Stale Liveblocks room is shorter than Convex — Convex wins (classic wipe cause).
  if (serverContent.length > ytextContent.length) {
    return serverContent;
  }

  // Liveblocks is longer: likely peer edits not flushed yet — keep the room.
  if (ytextContent.length > serverContent.length) {
    return ytextContent;
  }

  // Same length but different text — prefer Convex (last durable write).
  return serverContent;
}

/**
 * True when Liveblocks should be rewritten to match the authoritative seed.
 */
export function shouldReseedLiveblocks(
  ytextContent: string,
  seed: string,
): boolean {
  if (!seed) return false;
  if (ytextContent === seed) return false;
  if (!ytextContent) return true;
  // Any divergence on cold load: seed already went through pickAuthoritativeContent.
  return true;
}

/**
 * Whether an external Convex write (AI tool, another client) should replace
 * the current Liveblocks buffer.
 *
 * Peer edits flow through Yjs — this path is only for reseeds and intentional
 * external writes (AI). Never treat an autosave echo as authoritative while
 * the live buffer has already moved on.
 */
export function shouldApplyExternalContent(args: {
  ytextContent: string;
  serverContent: string;
  serverUpdatedAt: number | undefined;
  draft: FileContentDraft | null;
}): boolean {
  const { ytextContent, serverContent, draft } = args;
  if (!serverContent) return false;
  if (serverContent === ytextContent) return false;

  // Empty Liveblocks room with real server content — always apply.
  if (!ytextContent) return true;

  // Intentional external write (AI tool): draft was stamped with the incoming
  // server payload before/when Convex updated. Safe to push into the editor.
  if (draft && draft.content === serverContent) {
    return true;
  }

  // Server is clearly ahead of a shorter Liveblocks buffer — recover.
  if (serverContent.length > ytextContent.length) {
    return true;
  }

  // Live Yjs/draft already differs — clobbering it causes cursor jumps and
  // dropped characters (classic Monaco ↔ persistence race).
  return false;
}
