export type ContentSearchMatch = {
  path: string;
  line: number;
  column: number;
  lineText: string;
  matchStart: number;
  matchEnd: number;
};

export function matchesPathPrefix(path: string, pathPrefix: string): boolean {
  const prefix = pathPrefix.replace(/\/$/, "");
  if (!prefix) return true;
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function searchLineText(
  path: string,
  line: number,
  lineText: string,
  query: string,
  caseSensitive: boolean,
): ContentSearchMatch[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = caseSensitive ? trimmed : trimmed.toLowerCase();
  const haystack = caseSensitive ? lineText : lineText.toLowerCase();
  const matches: ContentSearchMatch[] = [];
  let start = 0;

  while (start < haystack.length) {
    const index = haystack.indexOf(needle, start);
    if (index === -1) break;

    matches.push({
      path,
      line,
      column: index + 1,
      lineText,
      matchStart: index,
      matchEnd: index + trimmed.length,
    });

    start = index + (needle.length || 1);
  }

  return matches;
}

export function searchFileContent(
  path: string,
  content: string,
  query: string,
  options?: { caseSensitive?: boolean; maxMatches?: number },
): ContentSearchMatch[] {
  const caseSensitive = options?.caseSensitive ?? false;
  const maxMatches = options?.maxMatches ?? Number.POSITIVE_INFINITY;
  const matches: ContentSearchMatch[] = [];

  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const lineMatches = searchLineText(
      path,
      i + 1,
      lines[i] ?? "",
      query,
      caseSensitive,
    );
    for (const match of lineMatches) {
      matches.push(match);
      if (matches.length >= maxMatches) {
        return matches;
      }
    }
  }

  return matches;
}
