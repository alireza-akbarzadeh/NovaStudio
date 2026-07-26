/** Netlify / Vercel dashboard deep links used by the Deploy menu. */

export function netlifySiteAdminUrl(siteName: string) {
  const name = siteName.trim();
  if (!name) return "https://app.netlify.com";
  return `https://app.netlify.com/sites/${encodeURIComponent(name)}`;
}

export function netlifyEnvVarsUrl(siteName: string) {
  return `${netlifySiteAdminUrl(siteName)}/configuration/env`;
}

export function netlifyDeploysUrl(siteName: string) {
  return `${netlifySiteAdminUrl(siteName)}/deploys`;
}

export function netlifyDeployLogUrl(siteName: string, deployId: string) {
  return `${netlifySiteAdminUrl(siteName)}/deploys/${encodeURIComponent(deployId)}`;
}

/** Classify Netlify build errors into short, actionable copy. */
export function classifyDeployError(message?: string | null): {
  kind: "repo_access" | "generic";
  title: string;
  hint: string;
} | null {
  if (!message?.trim()) return null;
  if (
    /unable to access repository|host key verification|could not read from remote|permissions may have changed|failed during stage ['"]preparing repo/i.test(
      message,
    )
  ) {
    return {
      kind: "repo_access",
      title: "Netlify can’t clone this GitHub repo",
      hint: "Install the Netlify GitHub App and grant it access to this repository, then redeploy.",
    };
  }
  return {
    kind: "generic",
    title: "Build failed",
    hint: message.trim().slice(0, 180),
  };
}

/**
 * Prefer the live site only when the deploy succeeded.
 * Otherwise open the provider build / inspector page (not a 404 site).
 */
export function deploymentOpenUrl(deployment: {
  status: string;
  url?: string;
  inspectorUrl?: string;
}): string | undefined {
  if (deployment.status === "ready" && deployment.url) {
    return deployment.url;
  }
  return deployment.inspectorUrl || undefined;
}
