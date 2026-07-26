import { sanitizeDeployName } from "./deploy";

type VercelUser = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
};

type VercelProject = {
  id: string;
  name: string;
  accountId?: string;
  link?: {
    type?: string;
    repo?: string;
    repoId?: number | string;
    org?: string;
    productionBranch?: string;
  };
};

type VercelDeployment = {
  id: string;
  url?: string;
  inspectorUrl?: string;
  readyState?: string;
  status?: string;
};

function teamQuery(teamId?: string | null) {
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
}

export async function verifyVercelToken(token: string): Promise<{
  accountId: string;
  accountName: string;
  accountSlug?: string;
}> {
  const response = await fetch("https://api.vercel.com/v2/user", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      text || "Invalid Vercel token. Create one at vercel.com/account/tokens.",
    );
  }
  const body = (await response.json()) as { user?: VercelUser } | VercelUser;
  const user = "user" in body && body.user ? body.user : (body as VercelUser);
  const accountId = user.id ?? "";
  const accountName = user.name || user.username || user.email || "Vercel account";
  if (!accountId) {
    throw new Error("Vercel token is valid but no user id was returned.");
  }
  return {
    accountId,
    accountName,
    accountSlug: user.username,
  };
}

async function listVercelProjects(
  token: string,
  teamId?: string | null,
): Promise<VercelProject[]> {
  const params = new URLSearchParams({ limit: "100" });
  if (teamId) params.set("teamId", teamId);
  const response = await fetch(
    `https://api.vercel.com/v9/projects?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const body = (await response.json()) as { projects?: VercelProject[] };
  return body.projects ?? [];
}

async function createVercelProject(args: {
  token: string;
  name: string;
  repo: string;
  teamId?: string | null;
}): Promise<VercelProject> {
  const response = await fetch(
    `https://api.vercel.com/v11/projects${teamQuery(args.teamId)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: sanitizeDeployName(args.name),
        gitRepository: {
          type: "github",
          repo: args.repo,
        },
      }),
    },
  );

  if (response.ok) {
    return (await response.json()) as VercelProject;
  }

  const text = await response.text();
  // Project may already exist — try to find by repo / name.
  if (response.status === 409 || /already exists|conflict/i.test(text)) {
    const projects = await listVercelProjects(args.token, args.teamId);
    const match =
      projects.find(
        (p) =>
          p.link?.repo === args.repo ||
          `${p.link?.org}/${p.link?.repo}` === args.repo ||
          p.name === sanitizeDeployName(args.name),
      ) ?? null;
    if (match) return match;
  }

  throw new Error(
    text ||
      "Could not create Vercel project. Connect GitHub in your Vercel account, then try again.",
  );
}

export async function deployVercelFromGit(args: {
  token: string;
  teamId?: string | null;
  projectName: string;
  repo: string;
  branch: string;
  target: "preview" | "production";
  existingProjectId?: string | null;
}): Promise<{
  projectId: string;
  projectName: string;
  deploymentId: string;
  url?: string;
  inspectorUrl?: string;
  status: string;
}> {
  let project: VercelProject | null = null;

  if (args.existingProjectId) {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(args.existingProjectId)}${teamQuery(args.teamId)}`,
      { headers: { Authorization: `Bearer ${args.token}` } },
    );
    if (response.ok) {
      project = (await response.json()) as VercelProject;
    }
  }

  if (!project) {
    project = await createVercelProject({
      token: args.token,
      name: args.projectName,
      repo: args.repo,
      teamId: args.teamId,
    });
  }

  const gitSource: Record<string, string | number> = {
    type: "github",
    ref: args.branch || "main",
  };
  if (project.link?.repoId != null) {
    gitSource.repoId = project.link.repoId;
  } else {
    gitSource.repo = args.repo;
    gitSource.org = args.repo.split("/")[0] ?? "";
  }

  const response = await fetch(
    `https://api.vercel.com/v13/deployments?forceNew=1${args.teamId ? `&teamId=${encodeURIComponent(args.teamId)}` : ""}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: project.name,
        project: project.id,
        gitSource,
        ...(args.target === "production" ? { target: "production" } : {}),
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Vercel deployment failed");
  }

  const deployment = (await response.json()) as VercelDeployment;
  const host = deployment.url
    ? deployment.url.startsWith("http")
      ? deployment.url
      : `https://${deployment.url}`
    : undefined;

  return {
    projectId: project.id,
    projectName: project.name,
    deploymentId: deployment.id,
    url: host,
    inspectorUrl: deployment.inspectorUrl,
    status: deployment.readyState || deployment.status || "QUEUED",
  };
}
