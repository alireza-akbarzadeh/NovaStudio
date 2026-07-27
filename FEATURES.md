# NovaStudio Editor — Feature Roadmap

Goal: make NovaStudio the place people choose instead of StackBlitz / CodeSandbox — an **AI-native collaborative IDE**, not just a sandbox.

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

### Sprint A — Git & navigation

These are the biggest daily-friction gaps you called out.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Git Diff Viewer** | `done` | Monaco DiffEditor: working tree vs last sync. Open from Changes list. |
| 2 | **Go to Definition / Click component → source** | `done` | ⌘/Ctrl-click JSX/imports jump to the defining file. |
| 3 | **Git UX polish** | `done` | Per-file +/− hunk counts, open file vs open diff, better empty/sync states, discard from diff. |
| 4 | **Problems / Diagnostics panel** | `done` | Errors & warnings list → click jumps to line. |
| 5 | **Command palette (⌘⇧P)** | `done` | Files + commands + recent. ⌘K outside editor also works. |

### Sprint B — Editor polish (current focus)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6 | Outline / symbols sidebar | `done` | Jump to functions, classes, components in the open file. |
| 7 | Preview chrome | `done` | Device sizes, URL bar, console overlay, error overlay. |
| 8 | Pin / preview tabs | `review` | VS Code–style sticky + italic preview tabs. |
| 9 | Drag-drop / upload files | `review` | Drop onto file tree. |

### Sprint C — Runtime (StackBlitz parity)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10 | Dependencies panel | `review` | Search npm, add/remove packages. |
| 11 | Real package install + Node terminal | `review` | WebContainer — real npm/pnpm/yarn/bun + auto-install. |
| 12 | Hot reload + preview console | `review` | Instant feedback loop. |
| 13 | Template gallery | `review` | React, Vite, Next, Node, static (+ TanStack, Empty). |

### Sprint D — AI delight

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 14 | Inline AI edit (⌘K in editor) | `review` | Selection → rewrite → Accept / Reject. |
| 15 | Multi-file AI apply with diffs | `review` | Per-file diff cards, Apply all / Reject. |
| 16 | Zen / Focus mode | `done` | Hide chrome, full-size editor. |
| 16b | **In-editor AI code review** | `review` | Explorer **Quality** tab (next to Project / Changes): review local diffs, Apply / Dismiss in the editor. |

### Sprint E — Hub & navigation

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 21 | **Project File Navigator** | `review` | JetBrains-style dialog: search, browse, create, rename. ⌘P · ⇧⇧ |
| 22 | **Team hub** | `review` | Members directory + pending access requests (approve / decline) |

### Sprint F — Integrations

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 23 | **Slack integration** | `review` | Incoming webhook · deploy success/failure alerts |
| 24 | **Discord integration** | `review` | Channel webhook · deploy success/failure alerts |
| 25 | **Linear integration** | `review` | API key · link issue in Git Info · sync on push / deploy |
| 26 | **Notion integration** | `review` | Internal integration · export AI plans + markdown docs to pages |

### Sprint G — Git & editor (current focus)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 27 | **Stash preview / diff** | `review` | Expand stash → file list → diff before apply · Apply & keep |

### Later / hard infrastructure

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | Full Next/Vite host (beyond esbuild) | `review` | WC-only for Vite/Next; esbuild for static. |
| 18 | Debugger | `review` | Bottom Debug tab: BPs + Run Node via WC. |
| 19 | Workspace-wide Live Share (terminal + preview) | `review` | Follow presence: file / preview / cwd. |
| 20 | Extensions marketplace | `review` | Curated themes + Vue language; installs persisted per user |

---

## Already strong (lean into these)

- Monaco + tabs / split + Prettier + settings.json
- File tree (create / rename / cut-copy-paste / keyboard)
- Find in Files + Go to File
- GitHub sync (stage / commit / push / pull / branches) — needs Diff + polish
- Liveblocks collab + presence + sharing
- AI chat tools + ghost-text suggestions
- Esbuild preview + WebContainer terminal (real npm)

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

### 4. Problems / Diagnostics panel — `done`

- Bottom panel tabs: **Problems** · **Terminal**
- Lists Monaco markers (errors / warnings / info) from open editors
- Click a problem → opens file and jumps to the line
- Status bar error/warning counts · activity bar · **⌘⇧M**

### 5. Command palette — `done`

- **⌘⇧P** opens a fuzzy palette (also **⌘K** when focus is outside the editor)
- Groups: Recent · Open editors · Commands · Files
- Run workspace actions or jump to any project file
- Esc closes; ⌘P remains Go to File only
- In the editor, **⌘K** opens Inline AI Edit instead (#14)

### 6. Outline / symbols sidebar — `done`

- Activity bar **Outline** view (⌘⇧O) for the active file
- Tree of functions, classes, components, and nested members
- Click a symbol → jumps to its line; filter box narrows the list
- Cursor-aware highlight of the enclosing symbol
- TypeScript / JavaScript via Monaco language service; CSS / HTML via lightweight outline

### 7. Preview chrome — `done`

- Device presets: Fit · Mobile · Tablet · Desktop (+ rotate for mobile/tablet)
- Editable URL bar (Enter reloads preview)
- Console overlay: captures `console.*` + uncaught errors from the iframe
- Error overlay for build / runtime / network failures (Dismiss · Refresh)

### 8. Pin / preview tabs — ready for review

- Single-click explorer / search / go-to-file / problems / definition → **italic preview** tab (one at a time)
- Double-click explorer (or edit / Keep Open / Pin) → permanent tab
- Right-click tab: Pin · Unpin · Keep Open · Split · Close
- Pinned tabs stay on the left with a pin icon

### 9. Drag-drop / upload files — ready for review

- Drop files or folders onto the explorer root or a folder (file rows use the parent folder)
- Drag project files/folders within the tree to move them into a folder or back to the root (VS Code–style)
- Toolbar **Upload** and context-menu **Upload…** (multi-file picker)
- Preserves `webkitRelativePath` for folder drops; renames on conflict (`foo-2.ts`)
- Text only · skips binary / over 512KB / ignored paths (`node_modules`, `.git`, …) with a toast summary

### 11. Real package install + Node terminal — ready for review

- WebContainer boots on `/projects/*` (COEP `credentialless` + COOP `same-origin`)
- Project files mount into the in-browser Node FS; `node_modules` stays in the container only
- Terminal `npm` / `pnpm` / `yarn` / `bun` spawn for real with streamed output
- After install/add/remove, `package.json` + lockfiles sync back to Convex
- Opening a project (including after clone) with `package.json` and no `node_modules` auto-runs the detected install once
- Preview uses WebContainer `dev`/`start` when available (#12); otherwise server esbuild

### 10. Dependencies panel — ready for review

- Activity bar **Dependencies** view (⌘⇧D)
- Lists production + dev deps from root `package.json`
- Search npm registry; **Add** / **Add as dev** / remove via WebContainer terminal
- Uses detected package manager (`npm` / `pnpm` / `yarn` / `bun`)

### 12. Hot reload + preview console — ready for review

- After install, auto-starts `dev` / `start` / `preview` / `serve` inside WebContainer
- Preview iframe uses the live WC URL (Vite HMR) with an **HMR** badge + open-in-new-tab
- Editor buffer writes into the container so edits hot-reload without a full rebuild
- Console shows server logs + preview errors (`forwardPreviewErrors` + injected bridge)
- Falls back to server esbuild `srcDoc` when there is no runnable script / WC offline
- Preview pane stays mounted when switching Code ↔ Preview so HMR state survives

### 20. Extensions marketplace — ready for review

- Activity bar **Extensions** view (⌘⇧X) with Marketplace / Installed tabs
- Curated catalog: GitHub Dark, Dracula, Nord, Solarized Light, Vue SFC highlighting
- Install / uninstall / enable persisted per user in Convex (`userExtensions`)
- One active editor theme at a time; language packs toggle independently
- Survives reload — no reinstall needed

### 13. Template gallery — ready for review

- New project page is a **template gallery** with category filters (All · Frontend · Full-stack · Backend · Blank)
- Starters: **React**, **Vite**, **Next.js**, **Node**, **Static**, plus TanStack Start and Empty
- Cards show tags + selection state; project name + Create opens the seeded workspace
- Seeds live in Convex (`projectTemplates`); `package.json` scripts work with WebContainer install / preview

### 16b. In-editor AI code review — ready for review

- Explorer tabs: **Project** · **Changes** · **Quality**
- **Quality** → **Review changes** runs NovaStudio AI on staged (or all local) diffs
- Findings list with severity, explanation, jump-to-file
- **Apply** writes the suggested full-file patch and keeps the file staged; **Dismiss** hides the finding
- No redirect to GitHub — suggestions stay inside the cloud editor
- Shortcut: **⌘⇧R** (opens Files → Quality)

### 14. Inline AI edit — ready for review

- **⌘K** in the editor opens a floating prompt over the selection (empty selection → current line)
- Type an instruction → **Generate** → preview rewrite in place
- **Accept** keeps the change · **Reject** / **Esc** restores the original
- Uses `QUICK_EDIT_PROMPT` + `/api/quick-edit` (Gemini)
- Command palette: **⌘⇧P** (or **⌘K** outside the editor)

### 15. Multi-file AI apply with diffs — ready for review

- Task-mode `writeFile` **queues** changes instead of writing immediately
- **Review AI changes** panel in the AI sidebar: per-file cards with +/− counts
- Expand a card for side-by-side Current vs Proposed Monaco diff
- **Apply** / **Reject** per file · **Apply all** / **Reject all** for the batch
- Code-block **Apply** also queues into the same review panel
- Agent is told not to claim files are saved until the user applies

### 16. Zen / Focus mode — `done`

- Hides toolbar, activity bars, and status bar; closes side/bottom/AI docks
- Editor fills the viewport (chrome-free full size)
- Restores the previous panel layout on exit (prefs not overwritten while zen)
- **⌥⌘Z** / **Ctrl+Alt+Z** toggle · **Esc** exits · toolbar Focus button · command palette
- Floating **Exit Zen** control while chrome is hidden

### 21. Project File Navigator — ready for review

- Reusable module at `file-navigator/`: tree wrapper, dialog, breadcrumb picker, shared search
- **Navigate Project Files** dialog: fuzzy search, recent + open editors, folder browse
- Create file/folder (Actions bar, typed path, Alt+A), rename (F2), move cut items into folders
- Breadcrumb dropdowns on each folder segment for quick sibling navigation
- Shortcuts: **⌘P** / **Ctrl+P** · **Shift Shift** (double Shift)

### 22. Team hub — ready for review

- Projects hub **Team** page lists collaborators across all accessible projects
- Role badges (owner / editor / viewer) and per-project links
- **Pending access requests** section for project owners: message, links, approve / decline
- Sidebar widget remains for quick triage from the hub home

### 23. Slack integration — ready for review

- Integrations hub **Slack** card: paste Incoming Webhook URL · test message on connect
- Webhook stored server-side (never returned to client)
- Posts to Slack when Vercel / Netlify deploys finish (**ready** or **error**)
- Disconnect clears the stored webhook

### 24. Discord integration — ready for review

- Same flow as Slack via channel webhook URL
- Rich embed on connect + deploy alerts with success/error styling
- Shares notification pipeline with in-app deploy notifications

### 25. Linear integration — ready for review

- Integrations hub **Linear** card: personal API key · verifies viewer + org on connect
- Git panel **Info** tab: link an issue by ID (e.g. `ENG-123`) · open in Linear · unlink
- **Push to GitHub** → comment on linked issue + move to In Review / In Progress when available
- **Deploy success** → comment + move to Done / Completed when available in team workflow
- API key stored server-side; never returned to clients

### 26. Notion integration — ready for review

- Integrations hub **Notion** card: internal integration secret + parent page URL
- Verifies integration access to the parent page on connect
- **AI plan mode** → Export to Notion on each plan card
- **Markdown tabs** → right-click tab → Export to Notion (uses draft buffer when unsaved)
- Creates child pages with headings, lists, paragraphs, and fenced code blocks
- Integration secret stored server-side; never returned to clients

### 27. Stash preview / diff — ready for review

- Git panel **Stashes** tab: expand a stash to see its files
- Click a file → inline Monaco diff (current tree vs stashed content)
- Per-file +/- counts before apply
- **Apply** removes the stash · **Apply & keep** restores without deleting

### 17. Full Next/Vite host — ready for review

- Vite / Next / TanStack projects preview **only** via WebContainer (`npm run dev`) — never the fake esbuild App Router mount
- Esbuild `/api/preview` remains for static HTML and simple client bundles
- Host detection skips non-HTTP Node scripts so CLI templates do not hang on “Starting…”
- Dev spawn binds `0.0.0.0` (Vite `--host` / Next `--hostname`) + 90s server-ready timeout
- Templates: Vite/React/TanStack `server.host`, Next hostname flags, plain CSS (no fake Tailwind)

### 18. Debugger — ready for review

- Bottom panel **Debug** tab (Problems · Debug · Terminal) · **⌘⇧Y** · activity bar
- Click the **glyph gutter** (left of line numbers) or press **F9** in `.js` / `.jsx` / `.ts` / `.tsx`
- **Run** instruments `debugger;` and executes via WebContainer (`node` or `npx tsx`) — open DevTools (F12) to pause
- Alt+click gutter still opens line comments · Breakpoint list → jump to line
- Live Vite/React UI debugging: Preview tab + browser DevTools still works alongside

### 19. Workspace Live Share (Follow) — ready for review

- Publishes each user’s focus: open file · Code/Preview · preview URL path · terminal cwd
- Toolbar avatars show location; **click a teammate to Follow** (click again to unfollow)
- Follow opens their file, switches Code/Preview, sets preview path, and syncs terminal cwd
- Sticky follow while they navigate; local navigation clears follow
- Not full terminal multiplexing / shared WC preview URLs (per-browser runtime)
