# Workspace Performance Plan

Track performance work for the NovaStudio / Polaris project workspace (large GitHub clones, file tree, search, terminal, preview, Monaco).

Use this doc to tackle **one item at a time**. Mark items `[x]` when done.

---

## Symptoms we are fixing

| Symptom | Typical cause |
|---------|----------------|
| Explorer ↔ Search feels like reloading | Panel unmount, full refetch/recompute |
| File tree spinner for a long time on big repos | UI blocked until **all** file bodies paginate in |
| Chrome ~8 GB RAM after cloning a large repo | Same data duplicated: Convex cache + JS heap + WebContainer + Monaco × tabs + Liveblocks |
| UI lag while typing in text search | Full-project scan on main thread |
| Lag after switching sidebar tabs | Remount + tree rebuild + state loss |

---

## Architecture (where memory goes)

On a repo near import limits (~5,000 files):

1. **Convex client cache** — metadata always; file bodies only when a feature opts in
2. **`useProjectFiles`** — metadata rows (paths/names); bodies via per-path or bulk loaders
3. **WebContainer filesystem** — second full copy when mounted
4. **Monaco** — one editor per open tab; each gets a subset of files for go-to-definition
5. **Liveblocks** — Y.Doc per open collaborative file tab
6. **`node_modules`** — after install inside WebContainer (browser memory)
7. **Search** — server-side Convex search index + paginated content scan fallback
8. **Unbounded Maps** — edit drafts, AI attachment cache (still open)

---

## Key files

| Area | Path |
|------|------|
| Files hook + provider | `src/features/workspace/hooks/use-project-files.ts`, `components/project-files-provider.tsx`, `lib/load-all-project-files.ts` |
| File tree | `hooks/use-file-tree-state.ts`, `components/workspace-file-tree.tsx`, `components/file-tree/virtualized-file-tree-list.tsx` |
| Sidebar panels | `components/workspace-sidebar.tsx`, `components/workspace-explorer-panel.tsx` |
| Search | `components/workspace-search-panel.tsx`, `lib/search.ts`, `hooks/use-project-server-text-search.ts`, `convex/projectSearch.ts` |
| WebContainer | `hooks/use-webcontainer.ts`, `lib/webcontainer/mount-filter.ts`, `lib/webcontainer/sync.ts` |
| Preview | `hooks/use-preview-server.ts` |
| Editor / Monaco | `views/file-editor-view.tsx`, `lib/resolve-import-path.ts` (`selectDefinitionFiles`) |
| Drafts | `lib/file-content-drafts.ts` |
| Change list | `components/workspace-change-list.tsx` |

---

## Completed

- [x] **Split metadata from content** — `useProjectFileMetadata()` for tree, go-to-file, file-name search, command palette
- [x] **`ProjectFilesProvider`** — single Convex subscription + merge at workspace layout level
- [x] **Keep Explorer + Search mounted** — `hidden` instead of unmount in `workspace-sidebar.tsx`
- [x] **Keep Explorer sub-tabs mounted** — Project / Changes / Quality in `workspace-explorer-panel.tsx`
- [x] **Search panel: progressive loading** — file search on metadata; text search waits for contents with status message
- [x] **Bounded Monaco `definitionFiles`** — max 250 relevant files via `selectDefinitionFiles()` in `resolve-import-path.ts`
- [x] **Virtualized file tree** — `@tanstack/react-virtual` when 60+ visible rows (`virtualized-file-tree-list.tsx`)
- [x] **Fix `WorkspaceChangeList` hooks order** — all hooks before early returns (keep-alive exposed the bug)
- [x] **Lazy WebContainer boot** — `ensureReady()`; no mount on page load
- [x] **WebContainer mount filter** — skip `node_modules`, `.git`, `.next`, `dist`, `build`, files > 512 KB
- [x] **Preview gated on Preview tab** — dev server does not start until preview view is active
- [x] **Web Worker text search** — `search.worker.ts` + `useProjectTextSearch` (250 ms debounce)
- [x] **Terminal: boot WC on demand** — `npm` / `node` / `npx` commands call `ensureReady()`
- [x] **P1.1 Draft LRU** — max 50 in-memory drafts; clear other projects on workspace enter
- [x] **P1.2 AI attachment LRU** — max 40 referenced file bodies in chat input
- [x] **P1.3 Per-file WC sync** — only write files whose signature changed
- [x] **P1.4 Editor tab mount limit** — max 3 mounted file editors (active + recent)
- [x] **P2.6 File tree UI state in zustand** — open folders, filter, selection keyed by `projectId`
- [x] **P2.7 Search result cap** — max 200 matches with "Show more"; worker stops early
- [x] **P2.8 Debounced change-list diff stats** — 300 ms debounce per row
- [x] **P2.9 Metadata migration** — chat composer/panel + dependencies panel
- [x] **P3.12 Dev performance panel** — bottom panel **Performance** tab (dev only)
- [x] **P3.10 Progressive clone** — batched GitHub import with live file progress; open workspace while cloning
- [x] **P3.11 Server-side search index** — Convex `projectFileSearchLines` table; `searchInProject` action; search panel uses server hook (no client file bodies for text search)
- [x] **P4.1 On-demand file content loading** — provider metadata-only; `useProjectAllFileContents` for WC/preview/metrics; per-path fetches for editor/AI/terminal/export

## Backlog — P1 Memory (highest impact)

Do these first on large clones and long editing sessions.

### 1. LRU cap on edit drafts

- [x] **Status:** Done
- **Problem:** `memoryDrafts` in `file-content-drafts.ts` grows forever (RAM + localStorage).
- **Fix:** Cap at ~50 entries; evict LRU on save. Optionally clear drafts for paths not in `changedFiles` on project switch.
- **Files:** `src/features/workspace/lib/file-content-drafts.ts`, `src/features/workspace/lib/lru-map.ts`
- **Verify:** Edit 100+ files; heap should not grow linearly with every touched path.

### 2. Cap AI attachment cache

- [x] **Status:** Done
- **Problem:** `fileContentsRef` Map in `workspace-ai-chat-input.tsx` grows with every @-mentioned file.
- **Fix:** Same LRU pattern (~30–50 entries) or store paths only and read content on send.
- **Files:** `src/features/workspace/components/workspace-ai-chat-input.tsx`
- **Verify:** Attach many files in chat; memory stable after cap.

### 3. Smarter WebContainer incremental sync

- [x] **Status:** Done
- **Problem:** After boot, any project hash change re-writes **every** changed file to WebContainer.
- **Fix:** Sync only: open editor paths, paths under `src/`, or diff since last sync (path + `updatedAt` map).
- **Files:** `src/features/workspace/hooks/use-webcontainer.ts`
- **Verify:** Save one file in a 3k-file repo; only that file (or small set) written to WC.

### 4. Limit mounted editor tabs

- [x] **Status:** Done
- **Problem:** All file tabs stay mounted (Monaco + Liveblocks per tab) — see `workspace-editor-panel.tsx` keep-alive comment.
- **Fix:** Mount active tab + last N tabs (e.g. 3); unmount others but persist tab list + restore on activate. Optionally lazy-mount Liveblocks only when tab focused.
- **Files:** `src/features/workspace/components/workspace-editor-panel.tsx`, `views/file-editor-view.tsx`, `components/liveblocks-file-room.tsx`
- **Verify:** Open 10 tabs; only ~3 Monaco instances in memory; switching remounts cleanly.

### 5. Change list: metadata + on-demand content

- [x] **Status:** Done
- **Problem:** `WorkspaceChangeList` uses full `useProjectFiles` for diff stats on every changed file.
- **Fix:** Use `useChangedFiles` + `getByPath` (or batched query) per visible row; debounce stat computation.
- **Files:** `src/features/workspace/components/workspace-change-list.tsx`, optionally `convex/projectFiles.ts`
- **Verify:** Changes tab usable while file bodies still loading; no main-thread spike on every keystroke elsewhere.

---

## Backlog — P2 UX / CPU

### 6. Persist file tree UI state in zustand

- [x] **Status:** Done
- **Problem:** Open folders, filter, selection live in component state (`use-file-tree-state.ts`).
- **Fix:** Store `openFolderIds`, `treeFilter`, selection keyed by `projectId` in `workspace-store.ts`.
- **Files:** `src/features/workspace/store/workspace-store.ts`, `hooks/use-file-tree-state.ts`
- **Verify:** Remount tree (or hot reload) preserves open folders.

### 7. Cap and paginate search results

- [x] **Status:** Done
- **Problem:** Broad query can return 10k+ matches; DOM renders all grouped results.
- **Fix:** Max 200 matches in UI; “Show more” / per-file collapse. Cap in worker optional.
- **Files:** `src/features/workspace/components/workspace-search-panel.tsx`, `lib/search.worker.ts`
- **Verify:** Search `a` in large repo; UI stays responsive; results capped.

### 8. Debounce change-list diff stats

- [x] **Status:** Done
- **Problem:** `countLineDiffStats` runs for all changed files on every `projectFiles` update.
- **Fix:** 300 ms debounce or compute only for expanded/visible rows.
- **Files:** `src/features/workspace/components/workspace-change-list.tsx`
- **Verify:** Typing in editor does not recompute all diffs synchronously.

### 9. Migrate more consumers to metadata-only

- [x] **Status:** Done
- **Problem:** Several components still call `useProjectFiles` when they only need paths/names.
- **Fix:** Switch to `useProjectFileMetadata` where content is unused; terminal uses metadata + on-demand `cat`; export fetches bodies on click.

| Component | Hook today | Likely needs |
|-----------|------------|--------------|
| `use-terminal-shell.ts` | metadata + `getByPath` for `cat` | metadata (completions via package.json) |
| `workspace-switcher.tsx` | fetch on export | metadata |
| `workspace-chat-panel.tsx` / `chat-composer.tsx` | metadata for mentions | metadata for mentions |
| `workspace-dependencies-panel.tsx` | `package.json` only | `package.json` only |

- **Verify:** Fewer blocked spinners; less duplicate merge work (provider already dedupes Convex).

---

## Backlog — P3 Scale / backend

### 10. Progressive clone (server)

- [x] **Status:** Done
- **Problem:** Import writes all rows at once; client still loads full content into Convex cache over time.
- **Fix:** Batch insert (40 files/step) with `importTotalFiles` / `importDoneFiles` progress; workspace banner + open while cloning.
- **Files:** `convex/githubImport.ts`, `convex/githubImportMutations.ts`, `components/workspace-import-banner.tsx`
- **Verify:** Clone progress shows tree before all bodies stored.

### 11. Server-side search index

- [x] **Status:** Done
- **Problem:** Worker search still postMessages entire project content on each query.
- **Fix:** Convex search index / per-line table updated on file write; batched backfill after import; `searchInProject` action with index + paginated scan fallback; client `useProjectServerTextSearch`.
- **Files:** `convex/projectSearch.ts`, `convex/lib/projectFileSearchIndex.ts`, `hooks/use-project-server-text-search.ts`, `components/workspace-search-panel.tsx`
- **Verify:** Text search on 5k files without shipping all bodies to worker.

### 12. Dev memory observability

- [x] **Status:** Done
- **Problem:** Hard to see regressions without Chrome Task Manager.
- **Fix:** Dev-only **Performance** bottom panel tab + command palette entry: file count, content bytes, WC status, tabs, JS heap.
- **Files:** `components/workspace-performance-panel.tsx`, `components/workspace-performance-charts.tsx`, `hooks/use-workspace-performance-stats.ts`
- **Open via:** bottom **Performance** tab, `⌘⇧.` shortcut, Settings search → "performance"
- **Verify:** Numbers update after clone, tab open, WC boot.

### 13. On-demand file content loading

- [x] **Status:** Done
- **Problem:** Opening a workspace auto-paginated every `projectFileContents` row into the Convex client cache and JS heap.
- **Fix:** `ProjectFilesProvider` metadata-only; `useProjectAllFileContents(enabled)` for WebContainer / esbuild preview / dev metrics; `getContentsByPaths` + `getByPath` for editor definitions, AI @-mentions, terminal `cat`; export uses one-shot `fetchAllProjectFilesWithContents`.
- **Files:** `hooks/use-project-files.ts`, `components/project-files-provider.tsx`, `lib/load-all-project-files.ts`, `convex/projectFiles.ts`
- **Verify:** Large clone opens with tree + search usable without multi-GB client cache growth; WC/preview still work when activated.

---

## Suggested order (one PR / session each)

1. ~~P1.1 — Draft LRU~~ ✅  
2. ~~P1.2 — AI attachment cap~~ ✅  
3. ~~P1.4 — Editor tab mount limit~~ ✅  
4. ~~P1.5 — Change list on-demand content~~ ✅  
5. ~~P1.3 — WC incremental sync scope~~ ✅  
6. ~~**P2.7 — Search result cap**~~ ✅  
7. ~~P2.9 — Metadata migration sweep~~ ✅  
8. ~~P2.6 — Tree state in zustand~~ ✅  
9. ~~P2.8 — Debounced diff stats~~ ✅  
10. ~~P3.12 — Dev performance panel~~ ✅  
11. ~~P3.10 — Progressive clone~~ ✅  
12. ~~P3.11 — Server-side search index~~ ✅  
13. ~~P4.1 — On-demand file content loading~~ ✅  

## Manual test checklist (large cloned repo)

After each change, spot-check:

- [ ] Open project → file tree appears before all files finish loading
- [ ] Switch Explorer ↔ Search repeatedly → no loading flash, folders stay open
- [ ] Text search while typing → UI responsive, results appear
- [ ] Open Terminal → WC boots once, `npm install` works
- [ ] Open Preview tab → dev server starts (not before)
- [ ] Open 5+ file tabs → memory acceptable in Chrome Task Manager
- [ ] Changes tab → no React hooks warnings in console

---

## Workarounds (users, until backlog done)

- Close unused file tabs on very large projects
- Avoid `npm install` until terminal/preview is needed
- Full page reload if memory gets extreme (clears WC + Monaco)
- Collapse file tree folders to reduce virtual row count

---

## Notes

- **Editor tab keep-alive** was intentional for Liveblocks + unsaved buffers — any limit must preserve drafts (`file-content-drafts.ts`) and tab restore.
- **WebContainer** requires cross-origin isolation; boot errors surface in terminal status banner.
- **Import limits** (see `convex/lib/githubFetch.ts`): ~5000 files, 512 KB/file — performance work assumes repos near these limits.
