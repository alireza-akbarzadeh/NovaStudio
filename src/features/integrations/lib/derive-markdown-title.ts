export function deriveMarkdownTitle(content: string, fallback = "NovaStudio export") {
  const heading = content.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.slice(0, 200);
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return fallback;
  return firstLine.replace(/^[*`-]+\s*/, "").slice(0, 200);
}
