# NovaStudio Community — Feature Roadmap

Goal: make `/projects/community` the place people **discover, sponsor, and contribute** to public workspaces — not just a static project list.

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

### Sprint A — Engagement (current focus)

Quick wins that use existing backend pieces or need minimal schema work.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Feature proposal upvotes** | `review` | Upvote / unvote sponsor ideas · sort by popularity |
| 2 | **Featured projects on hub** | `review` | Owner pins public project · highlighted row on community page |
| 3 | **Demo thumbnail in hero** | `review` | Inline video preview on project detail page (not only dialog) |
| 4 | **Wire preview section** | `review` | Live deploy snapshot or screenshot on detail page |

### Sprint B — Discovery

Make the hub usable at scale.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 5 | **Hub search** | `review` | Filter by name, tech, owner |
| 6 | **Hub sort & filters** | `review` | Trending · most starred · recently updated · accepting contributors |
| 7 | **Related projects** | `review` | Same tech stack or same owner on detail page |
| 8 | **Share buttons** | `review` | Copy link · social OG tags |

### Sprint C — Social & retention

Keep people coming back.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 9 | **Follow project** | `review` | Notify on roadmap / doc / deploy updates |
| 10 | **Activity feed** | `review` | Shipped items · new sponsors · new contributors |
| 11 | **Discussion / Q&A tab** | `review` | Lightweight comments on project page |
| 12 | **Sponsor wall** | `review` | Show sponsor names / tiers on detail page |

### Sprint D — Monetization

Turn sponsorship into real business value.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 13 | **Sponsorship tiers** | `review` | Supporter / backer / feature sponsor |
| 14 | **Bounties on roadmap** | `review` | Attach $ amount to public todos |
| 15 | **Tip jar (Stripe / Clerk Billing)** | `later` | One-click support for maintainers |
| 16 | **Paid feature bounties + escrow** | `later` | Hold funds until status = shipped |

### Sprint E — Contributors

Convert visitors into collaborators.

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 17 | **Owner access-request inbox** | `todo` | Approve / deny from community detail page |
| 18 | **Good first issue tags** | `todo` | Beginner-friendly roadmap items |
| 19 | **Fork / use template** | `todo` | One-click duplicate public project |
| 20 | **Contributor leaderboard** | `later` | Commits · reviews · shipped todos |

---

## Already shipped (community v1)

- Public project detail page (`/projects/community/[id]`)
- Hero + stats bar (stars, views, sponsors, clones, team size)
- About · contributors · public roadmap · docs (README / Contributing / License)
- Star · request access · open workspace · GitHub link · push to GitHub
- Demo video upload / watch
- Sponsor dialog → feature proposals with optional budget
- Community hub listing public workspaces

---

## Review checklist (every feature)

- [ ] Works in light + dark theme
- [ ] Fits existing community chrome (rounded cards, `coverTone`, stats bar)
- [ ] Empty / loading / error states feel intentional
- [ ] Auth-gated actions show clear feedback when signed out
- [ ] Does not regress access control on private projects

---

## Changelog (implemented)

### 1. Feature proposal upvotes — `review`

- `projectFeatureUpvotes` table tracks who upvoted each idea
- `toggleFeatureUpvote` mutation on community detail page
- Sponsor section shows upvote control + count; ideas sorted by popularity
- Proposer auto-upvotes their own proposal on submit

### 2. Featured projects on hub — `review`

- `communityFeaturedAt` on public projects marks them for the spotlight row
- Community hub shows **Featured projects** carousel above the full grid
- Featured cards show a violet **Featured** badge; duplicates are excluded from the main grid
- Owners toggle from **Share project** dialog or the banner on their community detail page
- Making a project private clears featured status automatically

### 3. Demo thumbnail in hero — `review`

- Hero uses a two-column layout on desktop: project info + inline demo panel
- Demo shows first-frame thumbnail with play overlay; click to play in place
- Owners see **Manage** to upload, replace, or remove via the existing dialog
- Empty state panel prompts owners to add a demo without opening the dialog first
- Mobile: demo stacks below hero with a **Watch demo** scroll shortcut

### 4. Wire preview section — `review`

- `getProjectDetails` resolves the latest ready deploy URL (production first) or linked deploy target
- **Live preview** section embeds the site in a browser-chrome iframe when a URL exists
- Provider badge (Vercel / Netlify), open-in-new-tab, and updated timestamp
- Empty state prompts owners to deploy from the workspace when no live URL is available

### 5. Hub search — `review`

- Search bar on `/projects/community` filters by project name, description, tech tags, and owner
- Multi-word queries match all terms (e.g. `react ali`)
- Featured row hides while searching; unified results grid with count + empty state
- Hub loads up to 100 public projects for search coverage

### 6. Hub sort & filters — `review`

- Sort dropdown: **Recently updated**, **Most starred**, **Trending** (by views)
- **Accepting contributors** toggle filters to projects you are not already on
- Works together with search; featured row hides when any filter/sort/search is active
- Result count reflects the combined query

### 7. Related projects — `review`

- Community detail page shows up to 6 related public projects at the bottom
- Matches by **same owner**, **overlapping tech stack**, or both
- Horizontal carousel with relation badge, stars, and link to each project page

### 8. Share buttons & tech stack — `review`

- Share bar on project detail: **Copy link**, **Post** (X/Twitter), **LinkedIn**, native share when available
- Open Graph + Twitter metadata via `getPublicProjectMetadata` for community URLs
- **Tech stack** shown in hero, stats bar, and About section with a consistent label

### 9. Follow project — `review`

- **Follow** button on community project detail (hidden for owners)
- Followers receive in-app notifications on roadmap updates, doc saves (README / Contributing / License), and successful deploys
- `projectFollows` table + `toggleProjectFollow` mutation; follower count on stats bar

### 10. Activity feed — `review`

- **Activity** section on community project detail (right column)
- Timeline of shipped roadmap items, shipped features, deploys, sponsors, and new team members
- `listCommunityProjectActivity` query; new `sponsored` activity type; events recorded on public project actions

### 11. Discussion / Q&A — `review`

- **Discussion & Q&A** section with **All** and **Open Q&A** tabs on community project detail
- Post questions, thread replies, owner **Answered** badge when the owner replies
- Owner/moderator can delete messages; project owner notified on new questions

### 12. Sponsor wall — `review`

- **Sponsor wall** section on community project detail, grouped by tier
- **Feature sponsor**, **Backer**, and **Supporter** tiers inferred from proposals and pledge amounts
- Avatar cards with message, amount, and proposed features; empty state with **Become a sponsor** CTA

### 13. Sponsorship tiers — `review`

- Explicit **Supporter**, **Backer**, and **Feature sponsor** tiers stored on `projectSponsors`
- Sponsor dialog tier picker with tier-specific fields (message / pledge / feature proposal)
- `joinAsSponsor` mutation for supporter & backer; feature proposals upgrade tier automatically
- Tiers never downgrade when re-sponsoring; wall uses stored tier with legacy fallback

### 14. Bounties on roadmap — `review`

- Optional **bounty amount** on public roadmap items (`bountyAmount` on `projectPublicTodos`)
- Roadmap shows amber bounty badges; open bounties sorted to the top with a count in the header
- Project owners/managers can **Add bounty** / **Edit bounty** inline on each open item
