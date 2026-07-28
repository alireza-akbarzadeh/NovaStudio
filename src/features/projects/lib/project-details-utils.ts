export function formatProjectCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toLocaleString();
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
