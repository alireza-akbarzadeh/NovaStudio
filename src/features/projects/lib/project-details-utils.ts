export function formatProjectCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
}

export function isProjectLinkedToGitHub(project: {
  source?: string;
  githubRepoUrl?: string;
}) {
  return (
    project.source === "github" && Boolean(project.githubRepoUrl?.trim())
  );
}

export const todoStatusLabel = {
  todo: "To do",
  "in-progress": "In progress",
  done: "Done",
} as const;

export const featureStatusStyles = {
  open: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  planned: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  funded: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  shipped: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
} as const;

export const sponsorTierMeta = {
  feature: {
    label: "Feature sponsor",
    shortLabel: "Feature",
    description:
      "Propose and optionally fund a specific feature for the roadmap.",
    badgeClass:
      "bg-fuchsia-500/12 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20",
    cardClass:
      "border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-500/10 via-card/80 to-violet-500/5",
    pickerClass:
      "border-fuchsia-500/40 bg-fuchsia-500/10 ring-2 ring-fuchsia-500/30",
  },
  backer: {
    label: "Backer",
    shortLabel: "Backer",
    description:
      "Pledge financial support — show up on the wall with your contribution.",
    badgeClass:
      "bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/20",
    cardClass:
      "border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-card/80 to-orange-500/5",
    pickerClass:
      "border-amber-500/40 bg-amber-500/10 ring-2 ring-amber-500/30",
  },
  supporter: {
    label: "Supporter",
    shortLabel: "Supporter",
    description:
      "Cheer on the project with a public message — no payment required.",
    badgeClass:
      "bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/20",
    cardClass:
      "border-sky-500/20 bg-gradient-to-br from-sky-500/8 via-card/80 to-blue-500/5",
    pickerClass:
      "border-sky-500/40 bg-sky-500/10 ring-2 ring-sky-500/30",
  },
} as const;

export const sponsorTierOrder = ["feature", "backer", "supporter"] as const;
