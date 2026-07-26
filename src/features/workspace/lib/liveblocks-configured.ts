/**
 * Liveblocks + Monaco Yjs sync is disabled.
 * Shared projects sync via Convex autosave + presence instead — avoids the
 * double-insert / caret bugs from binding Monaco to a Liveblocks Y.Doc.
 * Set to true only if reviving CRDT collab (and fixing the Monaco path).
 */
export const LIVEBLOCKS_COLLAB_ENABLED = false;

/** True when Liveblocks public key is present (safe for client checks). */
export function isLiveblocksConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY?.trim());
}

/** Liveblocks rooms are hard-disabled; always use local Convex editor. */
export function shouldUseLiveblocksCollaboration(_liveCollaboration: boolean) {
  return (
    LIVEBLOCKS_COLLAB_ENABLED &&
    _liveCollaboration &&
    isLiveblocksConfigured()
  );
}
