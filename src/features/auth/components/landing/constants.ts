export const FEATURES = [
  {
    id: "ai",
    label: "01 // AI",
    title: "Ask NovaStudio in context",
    description:
      "Chat against open files, the project tree, and diffs. Explain, refactor, or create — without leaving the editor.",
  },
  {
    id: "ide",
    label: "02 // IDE",
    title: "Full browser workspace",
    description:
      "Monaco editor, file explorer, multi-file tabs, and a real terminal — the whole loop runs in the browser.",
  },
  {
    id: "projects",
    label: "03 // Projects",
    title: "Hub for every workspace",
    description:
      "Search, pin, share, and continue where you left off. Import from GitHub or start fresh in one click.",
  },
  {
    id: "git",
    label: "04 // Git",
    title: "Status to publish",
    description:
      "Inspect changes, commit, and publish from the same surface you edit in — no context switch.",
  },
  {
    id: "terminal",
    label: "05 // Terminal",
    title: "Shell beside the code",
    description:
      "Install packages, run scripts, and debug failures next to the editor with live workspace sync.",
  },
  {
    id: "team",
    label: "06 // Team",
    title: "Invite and collaborate",
    description:
      "Share projects, manage members, and keep notifications and shortcuts within reach.",
  },
] as const;

export const SHOWCASES = [
  {
    id: "workspace",
    eyebrow: "Workspace",
    title: "Editor, terminal, and AI on one surface.",
    description:
      "Open a file, ask NovaStudio to change it, run the command that fails, and fix it — without hopping tools.",
    bullets: [
      "Monaco editor with multi-file tabs",
      "Integrated terminal for install, run, and debug",
      "Ask NovaStudio with project-aware suggestions",
    ],
    image: "/code.png",
    imageAlt:
      "NovaStudio workspace showing the code editor, file tree, terminal, and Ask NovaStudio assistant",
  },
  {
    id: "hub",
    eyebrow: "Projects hub",
    title: "Every project, one command center.",
    description:
      "Find what you were working on, pin what matters, import repos, and jump back into a workspace in seconds.",
    bullets: [
      "Pinned, recent, shared, and community views",
      "Search across projects, tech, and owners",
      "New project and GitHub import in one place",
    ],
    image: "/project-panel.png",
    imageAlt:
      "NovaStudio projects dashboard with project cards, filters, and workspace shortcuts",
  },
] as const;

export const COMING_SOON = [
  {
    label: "Live multiplayer",
    description:
      "Shared cursors and presence so teammates edit the same file in real time.",
  },
  {
    label: "One-click deploy",
    description:
      "Ship previews and production from the workspace without leaving NovaStudio.",
  },
  {
    label: "Branch & PR review",
    description:
      "Open diffs, comment inline, and push review-ready branches from the hub.",
  },
  {
    label: "Custom agents",
    description:
      "Specialized NovaStudio agents for tests, refactors, migrations, and docs.",
  },
  {
    label: "Template marketplace",
    description:
      "Start from community starters — Vue, React, Next, and more — ready to fork.",
  },
  {
    label: "Mobile companion",
    description:
      "Review diffs, approve AI patches, and check builds from your phone.",
  },
] as const;

export const WORKFLOW_STEPS = [
  {
    n: "01",
    t: "Open a workspace",
    d: "Create a project or clone from GitHub. NovaStudio boots the editor, file tree, and terminal together.",
  },
  {
    n: "02",
    t: "Describe intent",
    d: "Chat with the assistant against your open files, or select code and ask for a focused change.",
  },
  {
    n: "03",
    t: "Review the diff",
    d: "Accept edits in the editor, inspect git status, and keep history visible without leaving the tab.",
  },
  {
    n: "04",
    t: "Ship from the browser",
    d: "Commit, publish, and run commands in the workspace terminal — same surface end to end.",
  },
] as const;

export const FAQS = [
  {
    q: "Does NovaStudio send my code to the cloud?",
    a: "Your workspace runs in the browser against your project storage. AI features use the models configured for your plan — review Clerk Billing entitlements for what’s included.",
  },
  {
    q: "Do I need to install anything?",
    a: "No desktop app. Sign in, open a project, and the editor, Git tools, and terminal load in the browser.",
  },
  {
    q: "Can I clone from GitHub?",
    a: "Yes. Connect GitHub and clone a repository into a NovaStudio workspace, then edit and publish from the same UI.",
  },
  {
    q: "How does pricing work?",
    a: "Plans are managed with Clerk Billing. Scroll to Pricing below — the live table shows current tiers and opens checkout when you pick one.",
  },
  {
    q: "What happens after I subscribe?",
    a: "Checkout completes in Clerk’s drawer. You’re redirected to projects, and Pro entitlements unlock features gated by your plan.",
  },
] as const;
