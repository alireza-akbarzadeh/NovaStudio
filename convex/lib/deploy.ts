export type DeployProvider = "vercel" | "netlify";

export function sanitizeDeployName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 52) || "novastudio-project"
  );
}

export function normalizeGitHubRepo(repoUrl: string): string {
  const trimmed = repoUrl.trim();
  if (trimmed.includes("github.com")) {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      );
      const parts = url.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
      if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    } catch {
      // fall through
    }
  }
  return trimmed.replace(/\.git$/, "").replace(/^\/+/, "");
}

export function githubImportUrl(
  provider: DeployProvider,
  repoUrl: string,
): string {
  const githubUrl = repoUrl.startsWith("http")
    ? repoUrl
    : `https://github.com/${repoUrl}`;
  if (provider === "netlify") {
    return `https://app.netlify.com/start/deploy?repository=${encodeURIComponent(githubUrl)}`;
  }
  return `https://vercel.com/new/clone?repository-url=${encodeURIComponent(githubUrl)}`;
}

/** Keys exposed to the browser should stay plain on deploy providers. */
export function isPublicEnvKey(key: string): boolean {
  return /^(NEXT_PUBLIC_|VITE_|PUBLIC_|EXPO_PUBLIC_)/.test(key);
}
