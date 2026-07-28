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

## Current focus

**Sprint M — AI platform (Customize completion)** — **#43 Semantic codebase search** is ready for review.

---

## Sprint order

### Sprint A — Git & navigation

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Git Diff Viewer** | `done` | Monaco DiffEditor: working tree vs last sync. Open from Changes list. |
| 2 | **Go to Definition / Click component → source** | `done` | ⌘/Ctrl-click JSX/imports jump to the defining file. |
| 3 | **Git UX polish** | `done` | Per-file +/− hunk counts, open file vs open diff, better empty/sync states, discard from diff. |
| 4 | **Problems / Diagnostics panel** | `done` | Errors & warnings list → click jumps to line. |
| 5 | **Command palette (⌘⇧P)** | `done` | Files + commands + recent. ⌘K outside editor also works. |

### Sprint B — Editor polish

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 6 | Outline / symbols sidebar | `done` | Jump to functions, classes, components in the open file. |
| 7 | Preview chrome | `done` | Device sizes, URL bar, console overlay, error overlay. |
| 8 | Pin / preview tabs | `done` | VS Code–style sticky + italic preview tabs. |
| 9 | Drag-drop / upload files | `done` | Drop onto file tree. |

### Sprint C — Runtime (StackBlitz parity)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 10 | Dependencies panel | `done` | Search npm, add/remove packages. |
| 11 | Real package install + Node terminal | `done` | WebContainer — real npm/pnpm/yarn/bun + auto-install. |
| 12 | Hot reload + preview console | `done` | Instant feedback loop. |
| 13 | Template gallery | `done` | React, Vite, Next, Node, static (+ TanStack, Empty). |

### Sprint D — AI delight

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 14 | Inline AI edit (⌘K in editor) | `done` | Selection → rewrite → Accept / Reject. |
| 15 | Multi-file AI apply with diffs | `done` | Per-file diff cards, Apply all / Reject. |
| 16 | Zen / Focus mode | `done` | Hide chrome, full-size editor. |
| 16b | **In-editor AI code review** | `done` | Explorer **Quality** tab: review local diffs, Apply / Dismiss in the editor. |

### Sprint E — Hub & navigation

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 21 | **Project File Navigator** | `done` | JetBrains-style dialog: search, browse, create, rename. ⌘P · ⇧⇧ |
| 22 | **Team hub** | `done` | Members directory + pending access requests (approve / decline) |

### Sprint F — Integrations

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 23 | **Slack integration** | `done` | Incoming webhook · deploy success/failure alerts |
| 24 | **Discord integration** | `done` | Channel webhook · deploy success/failure alerts |
| 25 | **Linear integration** | `done` | API key · Git Linear tab · create / state / cycle · sync on push / deploy |
| 26 | **Notion integration** | `done` | Internal integration · export AI plans + markdown docs to pages |
| 31 | **Google Calendar** | `done` | Clerk Google OAuth · Calendar hub meetings · create event + Meet link |

### Sprint G — Git & editor

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 27 | **Stash preview / diff** | `done` | Expand stash → file list → diff before apply · Apply & keep |

### Sprint H — GitHub in-app hub

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 28 | **GitHub Issues hub** | `done` | Git panel → GitHub → Issues: list, create, comment, close/reopen |
| 29 | **GitHub Pull Requests hub** | `done` | List, create, open PR in full editor tab |
| 30 | **GitHub Actions / CI** | `done` | Workflow runs + status in GitHub hub |
| 31b | **PR inline review** | `done` | Side-by-side diff · line comments · collapsible threads · replies · copy suggestion |

### Sprint I — Git & editor

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 32 | **Git blame (inline annotations)** | `done` | Toggle in status bar · author + commit + age per line · click opens GitHub commit |
| 33 | **Merge conflict resolver** | `done` | 3-way merge on pull · Base / Yours / Theirs · Accept yours/theirs/both |
| 34 | **Find references / Rename symbol** | `done` | Shift+F12 references panel · F2 rename across project · import-aware |
| 35 | **Environment variables panel** | `done` | Left sidebar · `.env` / `.env.local` editor · toolbar `{ }` · ⌘⌥E · Vercel-style bulk paste |

### Sprint J — Runtime env

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 36 | **Env vars → WebContainer runtime** | `done` | `.env*` merged into terminal + preview spawns · auto-restart preview on save |

### Sprint K — Navigation & integrations

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 37 | **Go to Symbol in workspace** | `done` | ⌘T dialog · search functions/classes/types across project · jump to line |
| 38 | **File git history** | `done` | Git → History tab · toggle all commits vs current file |
| 39 | **Deploy env sync** | `done` | Env panel · Pull/Push Vercel or Netlify · merge into `.env*` (requires deploy link) |

### Sprint L — Git history & deploy polish

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 40 | **Restore file from git history** | `done` | File-scoped History · click commit → diff vs current · Restore to working tree |
| 41 | **Vercel deploy status polling** | `done` | Poll Vercel deployments until ready/error (matches Netlify) |
| 42 | **Peek definition** | `done` | Alt+F12 inline peek at symbol definition · command palette |

### Later / hard infrastructure (Sprints A–L)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | Full Next/Vite host (beyond esbuild) | `done` | WC-only for Vite/Next; esbuild for static. |
| 18 | Debugger | `done` | Bottom Debug tab: BPs + Run Node via WC. |
| 19 | Workspace-wide Live Share (terminal + preview) | `later` | Follow presence: file / preview / cwd. Shared terminal + shared preview URL deferred to Sprint N. |
| 20 | Extensions marketplace | `done` | Curated themes + Vue language; installs persisted per user |

---

## Shipped — previously undocumented

These were built alongside Sprints A–L but not tracked in the original roadmap. Marked `done` for completeness.

### Hub & projects

| Feature | Status | Notes |
|---------|--------|-------|
| **Overview dashboard** | `done` | Continue Working, pinned projects, stats, filters |
| **Collections hub** | `done` | Create collections, add/remove projects |
| **Activity hub** | `done` | Cross-project activity feed |
| **Trending hub** | `done` | Recently updated public projects |
| **Community hub** | `done` | Search, sort, request-access flow |
| **Project command picker** | `done` | ⌘K project switcher on `/projects` |
| **Hub sidebar + widgets** | `done` | Deadlines, notifications, shortcuts, storage meter |
| **Organization settings** | `done` | Clerk org profile at `/projects/org` |
| **GitHub clone/import** | `done` | Clone dialog, background job, progress banner |
| **CLI scaffold on create** | `done` | Next/React/Vite/TanStack + options dialog |
| **Publish menu + Deploy panel** | `done` | Vercel/Netlify deploy, export ZIP, deploy history |
| **Project sharing + email invites** | `done` | Invite-by-email, accept flow, roles |
| **Initialize Git repository** | `done` | Dialog from publish/git flows |

### Community & public projects

| Feature | Status | Notes |
|---------|--------|-------|
| **Public project details page** | `done` | Star, follow, fork, download, use as template |
| **Sponsorship system** | `done` | Tiers + sponsor wall (honor-system; Stripe in Sprint P) |
| **Feature proposals & upvotes** | `done` | Community ideas with voting |
| **Public roadmap / todos** | `done` | Owner-managed public todo list |
| **Community discussions** | `done` | Q&A / Announcements / Ideas threads |
| **Contributor leaderboard** | `done` | Per-project rankings |
| **Project docs section** | `done` | README slots, markdown render, GitHub sync |
| **Demo video** | `done` | Upload/manage demo on public projects |
| **Push to GitHub** | `done` | Publish unlinked public projects |
| **Project deadlines** | `done` | Calendar hub + sidebar widget |

### Workspace extras

| Feature | Status | Notes |
|---------|--------|-------|
| **Customize hub** | `done` | In-workspace `/customize` — Installed vs Marketplace |
| **Plugin marketplace** | `done` | Per-user installs; integrations + Figma/Datadog catalog |
| **Multi-terminal tabs** | `done` | VS Code–style +/tabs/kill |
| **Team chat panel** | `done` | @file mentions, attachments, voice notes |
| **In-editor line comments** | `done` | Gutter comments + Comments panel |
| **Locked files** | `done` | Per-file read-only locks |
| **Performance monitor** | `done` | Bottom panel: memory, tab stats (dev) |
| **Notifications panel** | `done` | In-app notifications + ⌘⇧N |
| **Workspace activity panel** | `done` | Per-project timeline + diff tabs |
| **AI commit message generation** | `done` | `/api/commit-message` from staged diffs |
| **AI chat history panel** | `done` | Session list in AI sidebar |
| **Editor typing performance** | `done` | Uncontrolled Monaco + debounced drafts (local editor) |

---

## Sprint M — AI platform (current focus)

Finish the Customize hub and make AI a first-class team surface.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 43 | **Semantic codebase search** | `review` | Ctrl+Alt+S · natural-language search · cited snippets · jump to line |
| 44 | **Custom MCP server connections** | `review` | Customize → MCPs · add SSE/HTTP URL · auth header · enable/disable |
| 45 | **Subagents & hooks manager** | `review` | Finish Customize placeholders: subagents, rules, pre/post AI hooks |
| 46 | **Shared AI chat sessions** | `todo` | Team-visible, persisted AI threads per project (not per-browser) |
| 47 | **Background agent runs** | `todo` | Queue long AI tasks that continue while the user edits elsewhere |
| 48 | **AI PR description generator** | `todo` | Draft PR title/body from branch diff (commit-message gen exists) |

### Sprint N — True collab runtime

Beat StackBlitz on shared runtime — the biggest remaining collab gap.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 49 | **Shared terminal (Live Share)** | `todo` | Followers see/run in the same terminal session |
| 50 | **Shared preview URL** | `todo` | One WebContainer dev server URL for all collaborators |
| 51 | **PR preview deploys** | `todo` | Auto-deploy branch to Vercel/Netlify preview when PR opens |
| 52 | **Test explorer & runner** | `todo` | Discover vitest/jest/playwright · run in WC · results panel |
| 53 | **Visual regression testing** | `todo` | Snapshot preview routes · diff screenshots on PRs |
| 54 | **Markdown split preview** | `todo` | Side-by-side `.md` editor + rendered preview |

### Sprint O — Power-user IDE polish

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 55 | **Snippets library** | `todo` | User/project snippet collections · Monaco tab completion |
| 56 | **Keybinding customization UI** | `todo` | Visual shortcut editor (not only User JSON) |
| 57 | **Call / type hierarchy** | `todo` | Caller trees + type inheritance beyond Find References |
| 58 | **Git worktrees UI** | `todo` | Parallel branch checkouts without stash-and-switch |
| 59 | **Open in local VS Code** | `todo` | Handoff link or devcontainer export for local dev |

### Sprint P — Community & monetization

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 60 | **Sponsorship payments (Stripe)** | `todo` | Real checkout for sponsor tiers |
| 61 | **Community upstream PR flow** | `todo` | Fork → branch → open PR back to original public project |
| 62 | **Public project embed** | `todo` | iframe/embeddable live preview for showcases |
| 63 | **AI onboarding tour** | `todo` | Interactive “how this codebase works” for new contributors |
| 64 | **Community moderation dashboard** | `todo` | Flag discussions, hide projects, ban repeat abusers |

### Sprint Q — Quality, specs & ops

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 65 | **Security scan in Quality tab** | `todo` | npm audit + AI scan for secrets/vulnerabilities in local diffs |
| 66 | **Spec-driven dev mode** | `todo` | Link Linear/Notion spec → AI implements with traceability |
| 67 | **AI changelog generator** | `todo` | Git range → release notes draft |
| 68 | **Database browser panel** | `todo` | Netlify DB / Convex data explorer from workspace |
| 69 | **Dependency update bot** | `todo` | AI-assisted bump PRs for outdated packages |

---

## Already strong (lean into these)

- Monaco + tabs / split + Prettier + settings.json
- File tree (create / rename / cut-copy-paste / keyboard)
- Find in Files + Go to File + Go to Symbol (⌘T)
- GitHub sync (stage / commit / push / pull / branches / diff / blame / stash / merge)
- Liveblocks collab + presence + sharing + Follow mode
- AI chat tools + ghost-text suggestions + inline edit + multi-file review
- Esbuild preview + WebContainer terminal (real npm) + env injection
- Integrations: GitHub, Linear, Notion, Slack, Discord, Calendar, Vercel, Netlify
- Community hub + public project pages + sponsorship UX
- Customize hub + plugin marketplace

---

## Review checklist (every feature)

- [ ] Works in light + dark theme
- [ ] Fits existing workspace chrome (`ws-*` tokens)
- [ ] Keyboard accessible where relevant
- [ ] Empty / loading / error states feel intentional
- [ ] Does not regress collab / drafts / git baseline

---

## Changelog (implemented)

### Roadmap refresh — Jul 2026

- Marked Sprints A–L (#1–42 + #17–20) as **done**
- Added **Shipped — previously undocumented** section (hub, community, customize, workspace extras)
- Added Sprints **M–Q** (#43–69) as the new build queue
- **#43 Semantic codebase search** — ready for review

### 43. Semantic codebase search — ready for review

- **Ctrl+Alt+S** (⌘⌥S on Mac) / command palette → **Semantic Codebase Search**
- Indexes project files into symbol-aware chunks (respects local drafts)
- Instant keyword matches while typing; AI refines results after a short pause
- Each result: one-line summary · code snippet · file + line range
- Click → opens file and reveals the matched lines
- API: `/api/semantic-search` (Gemini JSON results)

### Editor typing performance — `done`

- Local editor uses uncontrolled Monaco after mount (same pattern as Liveblocks collab)
- Debounced localStorage drafts + parent content updates
- Throttled JSX syntax highlighting to one run per animation frame

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

### 8. Pin / preview tabs — `done`

- Single-click explorer / search / go-to-file / problems / definition → **italic preview** tab (one at a time)
- Double-click explorer (or edit / Keep Open / Pin) → permanent tab
- Right-click tab: Pin · Unpin · Keep Open · Split · Close
- Pinned tabs stay on the left with a pin icon

### 9. Drag-drop / upload files — `done`

- Drop files or folders onto the explorer root or a folder (file rows use the parent folder)
- Drag project files/folders within the tree to move them into a folder or back to the root (VS Code–style)
- Toolbar **Upload** and context-menu **Upload…** (multi-file picker)
- Preserves `webkitRelativePath` for folder drops; renames on conflict (`foo-2.ts`)
- Text only · skips binary / over 512KB / ignored paths (`node_modules`, `.git`, …) with a toast summary

### 11. Real package install + Node terminal — `done`

- WebContainer boots on `/projects/*` (COEP `credentialless` + COOP `same-origin`)
- Project files mount into the in-browser Node FS; `node_modules` stays in the container only
- Terminal `npm` / `pnpm` / `yarn` / `bun` spawn for real with streamed output
- After install/add/remove, `package.json` + lockfiles sync back to Convex
- Opening a project (including after clone) with `package.json` and no `node_modules` auto-runs the detected install once
- Preview uses WebContainer `dev`/`start` when available (#12); otherwise server esbuild

### 10. Dependencies panel — `done`

- Activity bar **Dependencies** view (⌘⇧D)
- Lists production + dev deps from root `package.json`
- Search npm registry; **Add** / **Add as dev** / remove via WebContainer terminal
- Uses detected package manager (`npm` / `pnpm` / `yarn` / `bun`)

### 12. Hot reload + preview console — `done`

- After install, auto-starts `dev` / `start` / `preview` / `serve` inside WebContainer
- Preview iframe uses the live WC URL (Vite HMR) with an **HMR** badge + open-in-new-tab
- Editor buffer writes into the container so edits hot-reload without a full rebuild
- Console shows server logs + preview errors (`forwardPreviewErrors` + injected bridge)
- Falls back to server esbuild `srcDoc` when there is no runnable script / WC offline
- Preview pane stays mounted when switching Code ↔ Preview so HMR state survives

### 20. Extensions marketplace — `done`

- Activity bar **Extensions** view (⌘⇧X) with Marketplace / Installed tabs
- Curated catalog: GitHub Dark, Dracula, Nord, Solarized Light, Vue SFC highlighting
- Install / uninstall / enable persisted per user in Convex (`userExtensions`)
- One active editor theme at a time; language packs toggle independently
- Survives reload — no reinstall needed

### 13. Template gallery — `done`

- New project page is a **template gallery** with category filters (All · Frontend · Full-stack · Backend · Blank)
- Starters: **React**, **Vite**, **Next.js**, **Node**, **Static**, plus TanStack Start and Empty
- Cards show tags + selection state; project name + Create opens the seeded workspace
- Seeds live in Convex (`projectTemplates`); `package.json` scripts work with WebContainer install / preview

### 16b. In-editor AI code review — `done`

- Explorer tabs: **Project** · **Changes** · **Quality**
- **Quality** → **Review changes** runs NovaStudio AI on staged (or all local) diffs
- Findings list with severity, explanation, jump-to-file
- **Apply** writes the suggested full-file patch and keeps the file staged; **Dismiss** hides the finding
- No redirect to GitHub — suggestions stay inside the cloud editor
- Shortcut: **⌘⇧R** (opens Files → Quality)

### 14. Inline AI edit — `done`

- **⌘K** in the editor opens a floating prompt over the selection (empty selection → current line)
- Type an instruction → **Generate** → preview rewrite in place
- **Accept** keeps the change · **Reject** / **Esc** restores the original
- Uses `QUICK_EDIT_PROMPT` + `/api/quick-edit` (Gemini)
- Command palette: **⌘⇧P** (or **⌘K** outside the editor)

### 15. Multi-file AI apply with diffs — `done`

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

### 21. Project File Navigator — `done`

- Reusable module at `file-navigator/`: tree wrapper, dialog, breadcrumb picker, shared search
- **Navigate Project Files** dialog: fuzzy search, recent + open editors, folder browse
- Create file/folder (Actions bar, typed path, Alt+A), rename (F2), move cut items into folders
- Breadcrumb dropdowns on each folder segment for quick sibling navigation
- Shortcuts: **⌘P** / **Ctrl+P** · **Shift Shift** (double Shift)

### 22. Team hub — `done`

- Projects hub **Team** page lists collaborators across all accessible projects
- Role badges (owner / editor / viewer) and per-project links
- **Pending access requests** section for project owners: message, links, approve / decline
- Sidebar widget remains for quick triage from the hub home

### 23. Slack integration — `done`

- Integrations hub **Slack** card: paste Incoming Webhook URL · test message on connect
- Webhook stored server-side (never returned to client)
- Posts to Slack when Vercel / Netlify deploys finish (**ready** or **error**)
- Disconnect clears the stored webhook

### 24. Discord integration — `done`

- Same flow as Slack via channel webhook URL
- Rich embed on connect + deploy alerts with success/error styling
- Shares notification pipeline with in-app deploy notifications

### 25. Linear integration — `done`

- Integrations hub **Linear** card: personal API key · verifies viewer + org on connect
- Git panel **Linear** tab: team picker · Mine / Team / Cycle filters · list · create · assign · change state
- Create task: title · assignee · Todo / In Progress / Done · optional active cycle
- Issue detail: **Todo → In Progress → Done** shortcuts · assignee picker · full workflow state select · Link to project
- Active **cycle** (Linear sprint) filter + optional “Add to active cycle” on create
- Git panel **Info** tab: compact linked-issue summary · unlink
- **Push to GitHub** → comment on linked issue + move to In Review / In Progress when available
- **Deploy success** → comment + move to Done / Completed when available in team workflow
- API key stored server-side; never returned to clients

### 26. Notion integration — `done`

- Integrations hub **Notion** card: internal integration secret + parent page URL
- Verifies integration access to the parent page on connect
- **AI plan mode** → Export to Notion on each plan card
- **Markdown tabs** → right-click tab → Export to Notion (uses draft buffer when unsaved)
- Creates child pages with headings, lists, paragraphs, and fenced code blocks
- Integration secret stored server-side; never returned to clients

### 31. Google Calendar — `done`

- Integrations hub **Google Calendar** card: Clerk `oauth_google` + Calendar scopes (same pattern as GitHub)
- **Calendar hub**: meetings for the selected day · Join Meet · open in Google
- **Schedule meeting**: title · start/end · optional Google Meet link
- Project **deadlines** remain separate on the same page
- Access tokens fetched from Clerk at call time; never stored in Convex

### 27. Stash preview / diff — `done`

- Git panel **Stashes** tab: expand a stash to see its files
- Click a file → inline Monaco diff (current tree vs stashed content)
- Per-file +/- counts before apply
- **Apply** removes the stash · **Apply & keep** restores without deleting

### 28. GitHub Issues hub — `done`

- Git panel **GitHub** tab → **Issues** sub-tab
- List open/closed issues · create new · view detail inline
- Comment on issues · close / reopen without leaving NovaStudio

### 29. GitHub Pull Requests hub — `done`

- **Pull Requests** sub-tab: list, filter, create PR from branches
- Click a PR → opens as a **full-width editor tab** (not cramped sidebar)
- Review dropdown: Approve · Request changes · Merge
- Collapsible conversation panel for PR-level comments

### 30. GitHub Actions / CI — `done`

- **Actions** sub-tab lists recent workflow runs for the linked repo
- Status badges (success / failure / in progress) · link to run on GitHub

### 31. PR inline review — `done`

- Side-by-side Monaco diff per changed file
- Click a line or **+** to add a review comment with optional suggestion block
- Comments live in a **collapsible panel below the diff** (no overlap with code)
- Each thread collapses/expands · click line or thread to jump/highlight
- **Reply** in thread · **Copy** on suggested changes
- Parses GitHub ` ```suggestion ` blocks into a readable diff snippet

### 32. Git blame (inline annotations) — `done`

- Status bar **Blame** toggle on GitHub-linked projects (also **⌃⌘⇧B** / command palette)
- Fetches blame via GitHub GraphQL for the current branch + file
- Inline annotations at each line: author · short SHA · relative age
- Hover for commit message · click annotation → open commit on GitHub
- Requires GitHub connection + linked repository

### 33. Merge conflict resolver — `done`

- Pull with local changes → **Merge changes** (instead of only discard)
- Auto-merges non-overlapping edits via 3-way merge against last sync baseline
- Conflicts listed in **Git → Changes** banner
- Open a conflict → **Base · Yours · Theirs** side-by-side Monaco view
- **Accept yours** · **Accept theirs** · **Accept both**
- **Discard & pull** still available as destructive fallback

### 34. Find references / Rename symbol — `done`

- **Shift+F12** or command palette → **Find All References**
- Results in bottom **References** panel — grouped by file · click to jump
- **F2** or **Rename Symbol** → dialog renames across all matched files
- Respects import aliases and local bindings within the definition file set

### 35. Environment variables panel — `done`

- Left activity bar **Environment** `{ }` (4th icon, after Git) · toolbar button · **⌘⌥E** / command palette
- Edit `.env`, `.env.local`, `.env.development`, etc. as key/value rows
- **Vercel-style bulk import** — paste entire `.env` (lines or space-separated) → auto-parse → Merge / Replace
- Create missing env files · hide/show values · **Save** persists to Convex

### 36. Env vars → WebContainer runtime — `done`

- Merges `.env`, `.env.local`, `.env.development`, etc. (later files win)
- Injected into **terminal** spawns and **preview dev server** via WebContainer `env`
- Preview console logs how many vars were loaded on start
- Saving in the Environment panel **auto-restarts** a running preview (HMR server picks up new values)
- Files still sync to the container FS so Vite/Next native dotenv also works

### 37. Go to Symbol in workspace — `done`

- **⌘T** (or command palette) opens workspace symbol search
- Indexes functions, classes, types, and components across project files
- Fuzzy filter · click jumps to file + line
- Respects local editor drafts when indexing

### 38. File git history — `done`

- Git panel **History** tab lists recent commits on the linked branch
- Toggle **All commits** vs **current file** (when a file is open)
- Refresh · open commit on GitHub via external link icon

### 39. Deploy env sync — `done`

- Environment panel **Deploy sync** cards for Vercel + Netlify
- **Pull** merges remote variables into the editor · **Push** upserts editor rows to the linked project/site
- Compact provider cards (logo · link status · Pull | Push segmented control)
- Collapsible paste `.env` section · Save optional before push
- Requires deploy provider connection + at least one deploy to link the project/site

### 40. Restore file from git history — `done`

- Git → **History** with a file open → switch to file-scoped commits
- Click a commit → inline diff (current working tree vs file at that SHA)
- **Restore** writes the historical version into your working tree (with confirm)
- External link icon still opens the commit on GitHub

### 41. Vercel deploy status polling — `done`

- **Refresh deployment status** now polls Vercel (not just Netlify)
- Maps Vercel `readyState` → stored status · updates URL when live
- In-app + webhook notifications when status flips to ready/error

### 42. Peek definition — `done`

- **Alt+F12** or command palette → **Peek Definition**
- Uses Monaco peek widget with the existing go-to-definition resolver
- Works for imports, JSX components, and local symbols in `.ts` / `.tsx` / `.js` / `.jsx`

### 17. Full Next/Vite host — `done`

- Vite / Next / TanStack projects preview **only** via WebContainer (`npm run dev`) — never the fake esbuild App Router mount
- Esbuild `/api/preview` remains for static HTML and simple client bundles
- Host detection skips non-HTTP Node scripts so CLI templates do not hang on “Starting…”
- Dev spawn binds `0.0.0.0` (Vite `--host` / Next `--hostname`) + 90s server-ready timeout
- Templates: Vite/React/TanStack `server.host`, Next hostname flags, plain CSS (no fake Tailwind)

### 18. Debugger — `done`

- Bottom panel **Debug** tab (Problems · Debug · Terminal) · **⌘⇧Y** · activity bar
- Click the **glyph gutter** (left of line numbers) or press **F9** in `.js` / `.jsx` / `.ts` / `.tsx`
- **Run** instruments `debugger;` and executes via WebContainer (`node` or `npx tsx`) — open DevTools (F12) to pause
- Alt+click gutter still opens line comments · Breakpoint list → jump to line
- Live Vite/React UI debugging: Preview tab + browser DevTools still works alongside

### 19. Workspace Live Share (Follow) — `done` (partial)

- Publishes each user’s focus: open file · Code/Preview · preview URL path · terminal cwd
- Toolbar avatars show location; **click a teammate to Follow** (click again to unfollow)
- Follow opens their file, switches Code/Preview, sets preview path, and syncs terminal cwd
- Sticky follow while they navigate; local navigation clears follow
- **Deferred to Sprint N:** shared terminal multiplexing + shared WC preview URLs (#49–50)
