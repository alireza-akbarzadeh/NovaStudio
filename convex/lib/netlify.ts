import { sanitizeDeployName } from "./deploy";

type NetlifyUser = {
  id?: string;
  uid?: string;
  full_name?: string;
  email?: string;
  slug?: string;
};

type NetlifySite = {
  id: string;
  name: string;
  url?: string;
  ssl_url?: string;
  admin_url?: string;
  account_slug?: string;
};

type NetlifyBuild = {
  id?: string;
  deploy_id?: string;
  sha?: string;
};

function siteAdminBase(site: NetlifySite): string {
  const fromApi = site.admin_url?.replace(/\/$/, "");
  if (fromApi) return fromApi;
  return `https://app.netlify.com/sites/${encodeURIComponent(site.name)}`;
}

function deployInspectorUrl(site: NetlifySite, deployId?: string | null): string {
  const base = siteAdminBase(site);
  if (deployId && deployId !== site.id) {
    return `${base}/deploys/${encodeURIComponent(deployId)}`;
  }
  return `${base}/deploys`;
}

export async function verifyNetlifyToken(token: string): Promise<{
  accountId: string;
  accountName: string;
  accountSlug?: string;
}> {
  const response = await fetch("https://api.netlify.com/api/v1/user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text ||
        "Invalid Netlify token. Create one under User settings → Applications.",
    );
  }
  const user = (await response.json()) as NetlifyUser;
  const accountId = user.id || user.uid || "";
  const accountName = user.full_name || user.email || "Netlify account";
  if (!accountId) {
    throw new Error("Netlify token is valid but no user id was returned.");
  }
  return {
    accountId,
    accountName,
    accountSlug: user.slug,
  };
}

async function listNetlifySites(token: string): Promise<NetlifySite[]> {
  const response = await fetch("https://api.netlify.com/api/v1/sites?per_page=100", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as NetlifySite[];
}

async function createNetlifySite(args: {
  token: string;
  name: string;
  repo: string;
  branch: string;
}): Promise<NetlifySite> {
  const response = await fetch("https://api.netlify.com/api/v1/sites", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: sanitizeDeployName(args.name),
      repo: {
        provider: "github",
        repo: args.repo,
        branch: args.branch || "main",
      },
    }),
  });

  if (response.ok) {
    return (await response.json()) as NetlifySite;
  }

  const text = await response.text();
  // Fall back to an empty site if GitHub linking isn't available.
  if (/repo|github|installation|permission/i.test(text)) {
    const empty = await fetch("https://api.netlify.com/api/v1/sites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: sanitizeDeployName(args.name),
        created_via: "novastudio",
      }),
    });
    if (empty.ok) {
      const site = (await empty.json()) as NetlifySite;
      throw Object.assign(
        new Error(
          "Netlify site created, but GitHub linking needs the Netlify GitHub App. Finish setup in the Netlify UI, then redeploy.",
        ),
        { site, needsManualLink: true as const },
      );
    }
  }

  throw new Error(text || "Could not create Netlify site");
}

async function triggerNetlifyBuild(args: {
  token: string;
  siteId: string;
}): Promise<NetlifyBuild> {
  const response = await fetch(
    `https://api.netlify.com/api/v1/sites/${encodeURIComponent(args.siteId)}/builds`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clear_cache: false }),
    },
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return (await response.json()) as NetlifyBuild;
}

export async function deployNetlifyFromGit(args: {
  token: string;
  projectName: string;
  repo: string;
  branch: string;
  existingSiteId?: string | null;
}): Promise<{
  siteId: string;
  siteName: string;
  buildId: string;
  url?: string;
  inspectorUrl?: string;
  status: string;
  needsManualLink?: boolean;
}> {
  let site: NetlifySite | null = null;

  if (args.existingSiteId) {
    const response = await fetch(
      `https://api.netlify.com/api/v1/sites/${encodeURIComponent(args.existingSiteId)}`,
      { headers: { Authorization: `Bearer ${args.token}` } },
    );
    if (response.ok) {
      site = (await response.json()) as NetlifySite;
    }
  }

  if (!site) {
    const sites = await listNetlifySites(args.token);
    const wanted = sanitizeDeployName(args.projectName);
    site =
      sites.find((s) => s.name === wanted) ??
      null;
  }

  let needsManualLink = false;
  if (!site) {
    try {
      site = await createNetlifySite({
        token: args.token,
        name: args.projectName,
        repo: args.repo,
        branch: args.branch,
      });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "site" in error &&
        (error as { site?: NetlifySite }).site
      ) {
        site = (error as { site: NetlifySite }).site;
        needsManualLink = true;
      } else {
        throw error;
      }
    }
  }

  if (needsManualLink) {
    return {
      siteId: site.id,
      siteName: site.name,
      buildId: site.id,
      url: site.ssl_url || site.url,
      inspectorUrl: `${siteAdminBase(site)}/configuration/general`,
      status: "needs_setup",
      needsManualLink: true,
    };
  }

  const build = await triggerNetlifyBuild({
    token: args.token,
    siteId: site.id,
  });
  const buildId = build.deploy_id || build.id || site.id;

  return {
    siteId: site.id,
    siteName: site.name,
    buildId,
    url: site.ssl_url || site.url,
    inspectorUrl: deployInspectorUrl(site, build.deploy_id || build.id),
    status: "building",
  };
}

type NetlifyDeploy = {
  id: string;
  state?: string;
  error_message?: string | null;
  ssl_url?: string;
  url?: string;
  deploy_url?: string;
  admin_url?: string;
  site_id?: string;
};

/** Map Netlify deploy `state` into a compact status we store in Convex. */
export function normalizeNetlifyDeployState(state: string | undefined): string {
  const value = (state ?? "").toLowerCase();
  if (value === "ready") return "ready";
  if (value === "error" || value === "failed") return "error";
  if (value === "canceled" || value === "cancelled") return "cancelled";
  if (
    value === "new" ||
    value === "pending" ||
    value === "building" ||
    value === "enqueued" ||
    value === "uploading" ||
    value === "uploaded" ||
    value === "preparing" ||
    value === "prepared" ||
    value === "processing" ||
    value === "processed" ||
    value === "retrying"
  ) {
    return "building";
  }
  return value || "building";
}

export async function fetchNetlifyDeployStatus(args: {
  token: string;
  deployId: string;
}): Promise<{
  status: string;
  url?: string;
  inspectorUrl?: string;
  errorMessage?: string;
  rawState?: string;
}> {
  const response = await fetch(
    `https://api.netlify.com/api/v1/deploys/${encodeURIComponent(args.deployId)}`,
    { headers: { Authorization: `Bearer ${args.token}` } },
  );
  if (!response.ok) {
    throw new Error(await response.text() || "Could not fetch Netlify deploy status");
  }
  const deploy = (await response.json()) as NetlifyDeploy;
  const status = normalizeNetlifyDeployState(deploy.state);
  return {
    status,
    // Only surface the public URL once the deploy is actually live.
    url:
      status === "ready"
        ? deploy.ssl_url || deploy.url || deploy.deploy_url
        : undefined,
    inspectorUrl: deploy.admin_url,
    errorMessage: deploy.error_message ?? undefined,
    rawState: deploy.state,
  };
}

type NetlifyEnvVarValue = {
  value?: string;
  context?: string;
};

type NetlifyEnvVar = {
  key?: string;
  values?: NetlifyEnvVarValue[];
  is_secret?: boolean;
};

const NETLIFY_ENV_CONTEXT_PRIORITY = [
  "production",
  "all",
  "dev",
  "dev-server",
  "branch-deploy",
  "deploy-preview",
] as const;

function pickNetlifyEnvValue(values: NetlifyEnvVarValue[]): string {
  for (const context of NETLIFY_ENV_CONTEXT_PRIORITY) {
    const match = values.find(
      (entry) => entry.context === context && entry.value?.trim(),
    );
    if (match?.value) return match.value;
  }
  return values.find((entry) => entry.value?.trim())?.value ?? "";
}

export async function fetchNetlifySiteEnv(args: {
  token: string;
  siteId: string;
}): Promise<Array<{ key: string; value: string }>> {
  const response = await fetch(
    `https://api.netlify.com/api/v1/sites/${encodeURIComponent(args.siteId)}/env`,
    {
      headers: {
        Authorization: `Bearer ${args.token}`,
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const envs = (await response.json()) as NetlifyEnvVar[];
  const rows: Array<{ key: string; value: string }> = [];
  const seen = new Set<string>();

  for (const env of envs) {
    const key = env.key?.trim();
    if (!key) continue;
    const value = pickNetlifyEnvValue(env.values ?? []);
    if (!value.trim()) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ key, value });
  }

  return rows.sort((a, b) => a.key.localeCompare(b.key));
}
