# Polaris Editor — Feature Roadmap

Goal: make Polaris the place people choose instead of StackBlitz / CodeSandbox — an **AI-native collaborative IDE**, not just a sandbox.

We implement **one feature at a time**, review UI + behavior together, then move on.

---

## Status legend

| Status | Meaning |
|--------|---------|
| `todo` | Not started |
| `doing` | In progress |
| `review` | Implemented — waiting for your check |
| `done` | Shipped & reviewed |
| `later` | Intentionally deferred |

---

## Sprint order

### Sprint A — Git & navigation (current focus)

These are the biggest daily-friction gaps you called out.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Git Diff Viewer** | `done` | Monaco DiffEditor: working tree vs last sync. Open from Changes list. |
| 2 | **Go to Definition / Click component → source** | `done` | ⌘/Ctrl-click JSX/imports jump to the defining file. |
| 3 | **Git UX polish** | `done` | Per-file +/− hunk counts, open file vs open diff, better empty/sync states, discard from diff. |
| 4 | **Problems / Diagnostics panel** | `review` | Errors & warnings list → click jumps to line. |
| 5 | **Command palette (⌘K)** | `todo` | Files + commands + recent in one fuzzy palette. |

### Sprint B — Editor polish

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6 | Outline / symbols sidebar | `todo` | Jump to functions, classes, components in the open file. |
| 7 | Preview chrome | `todo` | Device sizes, URL bar, console overlay, error overlay. |
| 8 | Pin / preview tabs | `todo` | VS Code–style sticky + italic preview tabs. |
| 9 | Drag-drop / upload files | `todo` | Drop onto file tree. |

### Sprint C — Runtime (StackBlitz parity)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10 | Dependencies panel | `todo` | Search npm, add/remove packages. |
| 11 | Real package install + Node terminal | `todo` | WebContainer / sandbox — biggest credibility unlock. |
| 12 | Hot reload + preview console | `todo` | Instant feedback loop. |
| 13 | Template gallery | `todo` | React, Vite, Next, Node, static. |

### Sprint D — AI delight

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 14 | Inline AI edit (⌘K in editor) | `todo` | Selection → rewrite → Accept / Reject. |
| 15 | Multi-file AI apply with diffs | `todo` | Per-file diff cards, Apply all / Reject. |
| 16 | Zen / Focus mode | `todo` | Hide chrome, center editor. |

### Later / hard infrastructure

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | Full Next/Vite host (beyond esbuild) | `later` | |
| 18 | Debugger | `later` | |
| 19 | Workspace-wide Live Share (terminal + preview) | `later` | Beyond per-file Yjs |
| 20 | Extensions marketplace | `later` | |

---

## Already strong (lean into these)

- Monaco + tabs / split + Prettier + settings.json
- File tree (create / rename / cut-copy-paste / keyboard)
- Find in Files + Go to File
- GitHub sync (stage / commit / push / pull / branches) — needs Diff + polish
- Liveblocks collab + presence + sharing
- AI chat tools + ghost-text suggestions
- Esbuild preview + simulated terminal

---

## Review checklist (every feature)

- [ ] Works in light + dark theme
- [ ] Fits existing workspace chrome (`ws-*` tokens)
- [ ] Keyboard accessible where relevant
- [ ] Empty / loading / error states feel intentional
- [ ] Does not regress collab / drafts / git baseline

---

## Changelog (implemented)

### 1. Git Diff Viewer — `done`

- Click a file in **Git → Changes** to open a side-by-side Monaco diff tab
- Compares last synced baseline (`syncedContent`) vs working tree (incl. local drafts)
- Toolbar: Open file · Stage / Unstage · Discard
- Route: `/projects/[id]/diff/...`
- Coarse +/- line counts in the toolbar (true hunk stats come in Git UX polish)

### 2. Go to Definition — `done`

- ⌘/Ctrl-click or **F12** on:
  - Import paths (`from "./Button"`)
  - Imported names (`import { Button }`)
  - JSX components (`<Button />`)
- Resolves relative + `@/` aliases against project files
- Opens the target file tab and reveals the export / definition line
- Skips HTML tags and npm packages (`react`, `next/link`, …)

### 3. Git UX polish — `done`

- Real **+/- line counts** (LCS-based) on each change row and in the diff toolbar
- Clearer rows: filename + parent folder, click → diff, file icon → edit
- Empty states: “Working tree clean” and “Change tracking not ready” with CTA
- Changes header: file count · staged/unstaged · hint
- Diff toolbar shows Staged / Unstaged badge

### 4. Problems / Diagnostics panel — ready for review

- Bottom panel tabs: **Problems** · **Terminal**
- Lists Monaco markers (errors / warnings / info) from open editors
- Click a problem → opens file and jumps to the line
- Status bar error/warning counts · activity bar · **⌘⇧M**
