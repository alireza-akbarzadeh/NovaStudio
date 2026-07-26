# Contributing to NovaStudio

Thanks for helping build **NovaStudio** — an AI-native collaborative IDE in the browser.

This guide is the source of truth for how to set up the app, pick work, request features, and land a pull request. If something here conflicts with a GitHub issue comment, follow the issue (and please open a PR to update this file).

---

## Table of contents

1. [Code of conduct](#code-of-conduct)
2. [Ways to contribute](#ways-to-contribute)
3. [Find something to work on](#find-something-to-work-on)
4. [Request a feature](#request-a-feature)
5. [Report a bug](#report-a-bug)
6. [Development setup](#development-setup)
7. [Project structure](#project-structure)
8. [Coding guidelines](#coding-guidelines)
9. [Pull request process](#pull-request-process)
10. [Review checklist](#review-checklist)
11. [Community](#community)

---

## Code of conduct

- Be respectful and constructive in issues, PRs, and reviews.
- Assume good intent; disagree on ideas, not people.
- No harassment, spam, or off-topic promotion.
- Do not share secrets, tokens, or private user data in issues or PRs.

Maintainers may close or lock threads that break these norms.

---

## Ways to contribute

| Type | Examples |
|------|----------|
| **Code** | Roadmap features, bug fixes, performance, accessibility |
| **UI / UX** | Empty states, keyboard flows, light + dark theme polish |
| **Docs** | README, this guide, inline comments for tricky flows |
| **Issues** | Clear bug reports, feature requests, reproductions |
| **Triage** | Repro steps, labels suggestions, linking duplicates |

You do **not** need to be an expert in the whole stack. Small, focused PRs are preferred.

---

## Find something to work on

### 1. Check the roadmap

[`FEATURES.md`](./FEATURES.md) is the sprint board. Prefer items marked:

- `todo` — open for implementation
- `review` — polish / bugfix after trying the feature locally
- `help wanted` issues on GitHub — explicitly need contributors

**Current high-value `todo` targets** (good showcase contributions):

| Feature | Area | Notes |
|---------|------|--------|
| Inline AI edit (⌘K) | Workspace AI | Selection → rewrite → Accept / Reject |
| Multi-file AI apply with diffs | Workspace AI | Diff cards per file |
| Zen / Focus mode | Editor chrome | Hide panels, center editor |
| Team hub | Projects hub | Members, roles, pending requests |
| Slack, Linear, Discord, Vercel, Notion | Integrations | See `src/features/integrations` |

### 2. Browse GitHub issues

1. Open [Issues](https://github.com/alireza-akbarzadeh/polaris/issues).
2. Filter by labels such as:
   - `good first issue` — smaller, well-scoped
   - `help wanted` — maintainers want outside help
   - `enhancement` — new or improved behavior
   - `bug` — something broken
   - `roadmap` — tied to [`FEATURES.md`](./FEATURES.md)
3. Comment that you want to take it (`I'd like to work on this`) so we avoid duplicate work.
4. Wait for a quick ACK when possible, then open a draft PR early if the change is large.

### 3. Propose your own idea

If it is not on the roadmap, open a **Feature request** first (see below). Do not surprise the maintainers with a huge unsolicited PR.

---

## Request a feature

Feature requests help everyone see **what the app is**, **what is already built**, and **what still needs implementers**.

### Before you open one

1. Search [existing issues](https://github.com/alireza-akbarzadeh/polaris/issues?q=is%3Aissue).
2. Skim [`FEATURES.md`](./FEATURES.md) and the [README showcase](./README.md#showcase).
3. Check whether an integration is already listed as `coming-soon` in `src/features/integrations/lib/integrations-catalog.ts`.

### How to file

Use the GitHub **Feature request** issue template and fill every section:

1. **Problem** — what is painful or missing today?
2. **Proposed solution** — concrete behavior (not just “make AI better”).
3. **Alternatives** — other approaches you considered.
4. **Who benefits** — solo devs, teams, public projects, etc.
5. **Scope guess** — frontend / Convex / API / integration / docs.
6. **Mocks / screenshots** — optional but hugely helpful.
7. **Willingness to implement** — yes / maybe / no (so we can label `help wanted`).

### What happens next

Maintainers will typically:

1. Label the issue (`enhancement`, `roadmap`, `needs design`, …).
2. Ask clarifying questions if scope is unclear.
3. Either:
   - add it to [`FEATURES.md`](./FEATURES.md) as `todo`, or
   - mark it `later` / close as out of scope with a short reason.
4. If you offered to build it, assign you (or leave `help wanted` for others).

**Tip:** One feature per issue. Bundle only if the pieces cannot ship separately.

---

## Report a bug

Use the **Bug report** template and include:

- NovaStudio version / commit SHA if known
- Browser + OS
- Steps to reproduce
- Expected vs actual
- Console / network errors
- Screenshots or screen recording when UI-related

Security-sensitive bugs: **do not** file publicly. Contact the maintainers privately.

---

## Development setup

### Prerequisites

- Node.js **≥ 20.9**
- npm (lockfile in repo uses npm; stick to it unless the maintainers say otherwise)
- Clerk + Convex + Liveblocks accounts for a full local run

### Install

```bash
git clone https://github.com/alireza-akbarzadeh/polaris.git
cd polaris
npm install
```

### Environment variables

Create `.env.local` in the repo root. Minimum for auth + data + collab:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=

NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
CONVEX_DEPLOYMENT=

NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=
```

Optional but useful:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=   # AI chat
FIRECRAWL_API_KEY=
INNGEST_DEV=1                   # local Inngest
NEXT_PUBLIC_SENTRY_DSN=
```

Also set **Convex dashboard env** for server-side secrets used in `convex/` (for example `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, VAPID keys for push).


**Clerk ↔ Convex must use the same Clerk app.** If Convex trusts a different issuer than `.env.local`, you get `No auth provider found matching the given token`. Keep them aligned with:

```bash
npm run auth:check   # verify
npm run auth:sync    # copy .env.local Clerk issuer + secret → Convex
```

`npm run backend` runs `auth:sync` automatically via `prebackend`.

Never commit `.env.local` or real secrets.

### Run the app

```bash
# Terminal 1 — Convex backend (watch + codegen; syncs Clerk issuer first)
npm run backend

# Terminal 2 — Next.js
npm run dev

# Terminal 3 — background jobs (GitHub clone, etc.)
npm run inngest:dev
```

App: [http://localhost:3000](http://localhost:3000)

### Verify before PR

```bash
npm run lint
npm run build
```

---

## Project structure

```
src/
  app/                      # Routes, layouts, API routes
  features/
    auth/                   # Landing + auth shell
    billing/                # Pricing, user menu entitlements
    github/                 # Clone, connection, commit/push hooks
    integrations/           # Integrations hub + catalog
    notifications/          # Alerts + push
    projects/               # Projects hub / overview / team
    settings/               # Editor & project settings
    sharing/                # Invites / access
    workspace/              # Editor, terminal, git, AI, WebContainer
  components/               # Shared UI primitives & AI elements
  lib/                      # Cross-cutting helpers
convex/                     # Schema + queries/mutations/actions
public/                     # Static assets (README screenshots live here)
FEATURES.md                 # Sprint roadmap & changelog
```

**Feature-first rule:** put domain UI under `src/features/<domain>/`. Prefer extending an existing feature folder over creating a new top-level dump of components.

When touching Convex:

1. Read `convex/_generated/ai/guidelines.md` first.
2. Keep schema changes explicit and migration-aware.
3. Prefer queries/mutations that match existing auth patterns in `convex/auth.ts` / related helpers.

---

## Coding guidelines

### TypeScript & React

- TypeScript strictness as already configured — no `any` unless unavoidable and commented.
- Prefer existing hooks and feature modules over duplicating logic.
- Follow patterns already used nearby (forms, dialogs, Convex `useQuery` / `useMutation`).
- Do not add `useMemo` / `useCallback` “for performance” unless the surrounding code already does, or a measured need exists (React Compiler–friendly repo).

### UI

- Match existing workspace tokens (`ws-*` and current Tailwind patterns).
- Support **light and dark** themes for user-facing UI.
- Include empty, loading, and error states — do not leave blank panels.
- Keep keyboard paths working where similar features already support them.
- Prefer composition with shared components under `src/components/ui` and feature components — avoid one-off visual systems.

### Git / PR hygiene

- Branch names: `feat/short-name`, `fix/short-name`, `docs/short-name`.
- One concern per PR.
- Do not mix drive-by refactors with feature work.
- Do not commit secrets, large binaries, or unrelated lockfile churn.

### Docs

- If you ship a user-visible feature, update [`FEATURES.md`](./FEATURES.md) status (`todo` → `review` / `done`) and a short changelog note.
- If setup steps change, update this file and the README.

---

## Pull request process

1. **Fork** the repo (or use a branch if you have write access).
2. **Create a branch** from the default branch.
3. **Implement** the change with focused commits.
4. **Self-check** using the [review checklist](#review-checklist).
5. **Open a PR** using the pull request template:
   - What & why
   - Screenshots / recording for UI
   - Linked issue (`Closes #123`)
   - Test plan you actually ran
6. Mark as **Draft** if you want early feedback.
7. Respond to review comments; squash or keep history tidy if maintainers ask.
8. Maintainers merge when checks pass and the review checklist is green.

### Commit messages

Prefer short, imperative subjects:

```text
feat(workspace): add zen mode toggle
fix(git): correct hunk counts on empty files
docs: clarify feature request flow
```

---

## Review checklist

Every feature PR should pass this bar (also mirrored in [`FEATURES.md`](./FEATURES.md)):

- [ ] Works in **light + dark** theme
- [ ] Fits existing workspace / hub chrome (no orphan visual language)
- [ ] Keyboard accessible where relevant
- [ ] Empty / loading / error states feel intentional
- [ ] Does not regress collab, drafts, or git baseline
- [ ] `npm run lint` passes
- [ ] `npm run build` passes (or note why it cannot in CI-less forks)
- [ ] `FEATURES.md` / README updated when status or setup changes
- [ ] No secrets in the diff

---

## Community

- **Questions about contributing:** open a Discussion or an issue with the `question` label if available.
- **Feature ideas:** [Feature request template](https://github.com/alireza-akbarzadeh/polaris/issues/new/choose).
- **Bugs:** [Bug report template](https://github.com/alireza-akbarzadeh/polaris/issues/new/choose).
- **Roadmap:** [`FEATURES.md`](./FEATURES.md).
- **Product screenshots:** [`README.md` Showcase](./README.md#showcase).

Welcome aboard — pick a `todo`, open a PR, and help make NovaStudio the browser IDE people choose.
