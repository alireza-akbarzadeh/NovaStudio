export function formatBlogDate(publishedAt: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(publishedAt));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("");
}
