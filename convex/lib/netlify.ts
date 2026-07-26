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
      inspectorUrl: site.admin_url,
      status: "needs_setup",
      needsManualLink: true,
    };
  }

  const build = await triggerNetlifyBuild({
    token: args.token,
    siteId: site.id,
  });

  return {
    siteId: site.id,
    siteName: site.name,
    buildId: build.id || build.deploy_id || site.id,
    url: site.ssl_url || site.url,
    inspectorUrl: site.admin_url,
    status: "building",
  };
}
