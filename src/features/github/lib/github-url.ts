/** Extract owner/repo from stored refs, ignoring /tree, /blob, and .git suffixes. */
export function normalizeGitHubRepoRef(repoUrl: string): string | null {
  const trimmed = repoUrl.trim();
  if (!trimmed) return null;

  const sshMatch = trimmed.match(/^git@github\.com:([^/]+)\/([^/]+)/i);
  if (sshMatch) {
    return `${sshMatch[1]}/${sshMatch[2]!.replace(/\.git$/, "")}`;
  }

  const urlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/]+)/i,
  );
  if (urlMatch) {
    return `${urlMatch[1]}/${urlMatch[2]!.replace(/\.git$/, "")}`;
  }

  const shortMatch = trimmed.match(/^([^/]+)\/([^/]+)$/);
  if (shortMatch) {
    return `${shortMatch[1]}/${shortMatch[2]}`;
  }

  return null;
}

/** Normalize stored GitHub repo refs to a browser URL. */
export function toGitHubUrl(
  repoUrl: string,
  options?: { branch?: string; path?: string },
) {
  const repoRef = normalizeGitHubRepoRef(repoUrl);
  const base = repoRef ? `https://github.com/${repoRef}` : "https://github.com";

  const branch = options?.branch?.trim();
  const path = options?.path?.trim().replace(/^\/+/, "");
  if (branch && path) {
    return `${base}/blob/${encodeURIComponent(branch)}/${path}`;
  }
  if (branch) {
    return `${base}/tree/${encodeURIComponent(branch)}`;
  }
  return base;
}
