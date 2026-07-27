const LINEAR_API = "https://api.linear.app/graphql";

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function linearGraphql<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey.trim(),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Linear API failed (${response.status})`);
  }

  const payload = (await response.json()) as GraphqlResponse<T>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  if (!payload.data) {
    throw new Error("Linear API returned no data");
  }
  return payload.data;
}

export type LinearViewer = {
  id: string;
  name: string;
  email?: string;
  organization?: { id: string; name: string };
};

export type LinearIssueSummary = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  state?: { id: string; name: string };
  team?: {
    states: {
      nodes: Array<{ id: string; name: string; type: string }>;
    };
  };
};

export function normalizeLinearIssueIdentifier(raw: string) {
  const trimmed = raw.trim().toUpperCase();
  const match = trimmed.match(/^([A-Z0-9]+)-(\d+)$/);
  if (!match) {
    throw new Error(
      "Use a Linear issue ID like ENG-123 (team key + number)",
    );
  }
  return `${match[1]}-${match[2]}`;
}

export async function verifyLinearApiKey(apiKey: string): Promise<{
  viewerName: string;
  organizationName?: string;
}> {
  const data = await linearGraphql<{
    viewer: LinearViewer;
  }>(
    apiKey,
    `query Viewer {
      viewer {
        id
        name
        email
        organization { id name }
      }
    }`,
  );

  return {
    viewerName: data.viewer.name,
    organizationName: data.viewer.organization?.name,
  };
}

export async function fetchLinearIssueByIdentifier(
  apiKey: string,
  identifier: string,
): Promise<LinearIssueSummary> {
  const normalized = normalizeLinearIssueIdentifier(identifier);
  const data = await linearGraphql<{
    issueSearch: { nodes: LinearIssueSummary[] };
  }>(
    apiKey,
    `query IssueSearch($query: String!) {
      issueSearch(query: $query, first: 5) {
        nodes {
          id
          identifier
          title
          url
          state { id name }
          team {
            states {
              nodes { id name type }
            }
          }
        }
      }
    }`,
    { query: normalized },
  );

  const issue = data.issueSearch.nodes.find(
    (node) => node.identifier.toUpperCase() === normalized,
  );
  if (!issue) {
    throw new Error(`Linear issue ${normalized} was not found`);
  }
  return issue;
}

function pickWorkflowState(
  team: LinearIssueSummary["team"],
  preferredNames: string[],
) {
  const states = team?.states.nodes ?? [];
  for (const name of preferredNames) {
    const match = states.find(
      (state) => state.name.toLowerCase() === name.toLowerCase(),
    );
    if (match) return match;
  }
  return null;
}

export async function commentOnLinearIssue(
  apiKey: string,
  issueId: string,
  body: string,
) {
  await linearGraphql(
    apiKey,
    `mutation CommentCreate($issueId: String!, $body: String!) {
      commentCreate(input: { issueId: $issueId, body: $body }) {
        success
      }
    }`,
    { issueId, body },
  );
}

export async function updateLinearIssueState(
  apiKey: string,
  issueId: string,
  stateId: string,
) {
  const data = await linearGraphql<{
    issueUpdate: { success: boolean; issue?: { state?: { name: string } } };
  }>(
    apiKey,
    `mutation IssueUpdate($id: String!, $stateId: String!) {
      issueUpdate(id: $id, input: { stateId: $stateId }) {
        success
        issue { state { name } }
      }
    }`,
    { id: issueId, stateId },
  );

  if (!data.issueUpdate.success) {
    throw new Error("Linear could not update issue status");
  }
  return data.issueUpdate.issue?.state?.name;
}

export async function syncLinearIssue(args: {
  apiKey: string;
  issue: LinearIssueSummary;
  event: "push" | "deploy";
  projectName: string;
  detailUrl?: string;
  commitSha?: string;
}) {
  const lines =
    args.event === "push"
      ? [
          `**NovaStudio push** — changes for *${args.projectName}* were pushed to GitHub.`,
          args.commitSha ? `Commit \`${args.commitSha.slice(0, 7)}\`` : null,
          args.detailUrl ? `[Open project](${args.detailUrl})` : null,
        ]
      : [
          `**NovaStudio deploy** — *${args.projectName}* is live.`,
          args.detailUrl ? `[Open site](${args.detailUrl})` : null,
        ];

  await commentOnLinearIssue(args.apiKey, args.issue.id, lines.filter(Boolean).join("\n"));

  const preferredStates =
    args.event === "push"
      ? ["In Review", "Review", "In Progress"]
      : ["Done", "Completed", "Released", "Shipped"];

  const nextState = pickWorkflowState(args.issue.team, preferredStates);
  if (!nextState) return { stateUpdated: false as const };

  const stateName = await updateLinearIssueState(
    args.apiKey,
    args.issue.id,
    nextState.id,
  );
  return { stateUpdated: true as const, stateName };
}
