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
  if (payload.errors?.length && !payload.data) {
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

export type LinearWorkflowState = {
  id: string;
  name: string;
  type: string;
  color?: string;
  position?: number;
};

export type LinearTeamSummary = {
  id: string;
  name: string;
  key: string;
};

export type LinearCycleSummary = {
  id: string;
  name: string;
  number: number;
  endsAt?: string | null;
};

export type LinearMember = {
  id: string;
  name: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export type LinearAssignee = {
  id: string;
  name: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type LinearIssueListItem = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  updatedAt: string;
  state?: { id: string; name: string; type: string; color?: string };
  assignee?: LinearAssignee | null;
  cycle?: { id: string; name: string; number: number } | null;
};

export type LinearIssueDetail = LinearIssueListItem & {
  description?: string | null;
  createdAt: string;
  team: {
    id: string;
    name: string;
    key: string;
    states: { nodes: LinearWorkflowState[] };
  };
};

export type LinearIssueScope = "mine" | "team" | "cycle";

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

function parseLinearIssueIdentifier(raw: string): {
  teamKey: string;
  number: number;
  identifier: string;
} {
  const identifier = normalizeLinearIssueIdentifier(raw);
  const match = identifier.match(/^([A-Z0-9]+)-(\d+)$/);
  if (!match) {
    throw new Error(
      "Use a Linear issue ID like ENG-123 (team key + number)",
    );
  }
  return {
    teamKey: match[1],
    number: Number(match[2]),
    identifier,
  };
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
  const { teamKey, number, identifier: normalized } =
    parseLinearIssueIdentifier(identifier);
  // `issueSearch` is deprecated — look up by team key + number instead.
  const data = await linearGraphql<{
    issues: { nodes: LinearIssueSummary[] };
  }>(
    apiKey,
    `query IssueByIdentifier($teamKey: String!, $number: Float!) {
      issues(
        first: 1
        filter: {
          team: { key: { eq: $teamKey } }
          number: { eq: $number }
        }
      ) {
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
    { teamKey, number },
  );

  const issue = data.issues.nodes.find(
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

export async function listLinearTeams(
  apiKey: string,
): Promise<LinearTeamSummary[]> {
  const data = await linearGraphql<{
    teams: { nodes: LinearTeamSummary[] };
  }>(
    apiKey,
    `query Teams {
      teams(first: 50) {
        nodes { id name key }
      }
    }`,
  );
  return data.teams.nodes;
}

export async function getActiveLinearCycle(
  apiKey: string,
  teamId: string,
): Promise<LinearCycleSummary | null> {
  const data = await linearGraphql<{
    team: {
      activeCycle: {
        id: string;
        name: string;
        number: number;
        endsAt?: string | null;
      } | null;
    } | null;
  }>(
    apiKey,
    `query ActiveCycle($teamId: String!) {
      team(id: $teamId) {
        activeCycle { id name number endsAt }
      }
    }`,
    { teamId },
  );

  const cycle = data.team?.activeCycle;
  if (!cycle) return null;
  return {
    id: cycle.id,
    name: cycle.name,
    number: cycle.number,
    endsAt: cycle.endsAt,
  };
}

export async function listLinearWorkflowStates(
  apiKey: string,
  teamId: string,
): Promise<LinearWorkflowState[]> {
  const data = await linearGraphql<{
    team: {
      states: { nodes: LinearWorkflowState[] };
    } | null;
  }>(
    apiKey,
    `query TeamStates($teamId: String!) {
      team(id: $teamId) {
        states {
          nodes { id name type color position }
        }
      }
    }`,
    { teamId },
  );

  const states = data.team?.states.nodes ?? [];
  return [...states].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
}

export async function listLinearTeamMembers(
  apiKey: string,
  teamId: string,
): Promise<LinearMember[]> {
  const data = await linearGraphql<{
    team: {
      members: { nodes: LinearMember[] };
    } | null;
  }>(
    apiKey,
    `query TeamMembers($teamId: String!) {
      team(id: $teamId) {
        members(first: 100) {
          nodes {
            id
            name
            displayName
            email
            avatarUrl
          }
        }
      }
    }`,
    { teamId },
  );

  const members = data.team?.members.nodes ?? [];
  return [...members].sort((a, b) =>
    (a.displayName || a.name).localeCompare(b.displayName || b.name),
  );
}

/** Pick a representative workflow state for Todo / Doing / Done shortcuts. */
export function pickStateByStage(
  states: LinearWorkflowState[],
  stage: "todo" | "started" | "done",
): LinearWorkflowState | null {
  const sorted = [...states].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  if (stage === "todo") {
    return (
      sorted.find((s) => s.type === "unstarted") ??
      sorted.find((s) => s.type === "backlog") ??
      sorted.find((s) => s.type === "triage") ??
      null
    );
  }
  if (stage === "started") {
    return sorted.find((s) => s.type === "started") ?? null;
  }
  return (
    sorted.find((s) => s.type === "completed") ??
    sorted.find((s) => s.type === "canceled") ??
    null
  );
}

function buildIssueFilterObject(
  scope: LinearIssueScope,
  cycleId?: string,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    state: {
      type: { nin: ["completed", "canceled"] },
    },
  };

  if (scope === "mine") {
    filter.assignee = { isMe: { eq: true } };
  }

  if (scope === "cycle") {
    if (!cycleId) {
      throw new Error("No active cycle for this team");
    }
    filter.cycle = { id: { eq: cycleId } };
  }

  return filter;
}

export async function listLinearIssues(args: {
  apiKey: string;
  teamId: string;
  scope: LinearIssueScope;
  limit?: number;
}): Promise<{
  issues: LinearIssueListItem[];
  activeCycle: LinearCycleSummary | null;
}> {
  const first = Math.min(Math.max(args.limit ?? 40, 1), 50);
  const activeCycle = await getActiveLinearCycle(args.apiKey, args.teamId);

  if (args.scope === "cycle" && !activeCycle) {
    return { issues: [], activeCycle: null };
  }

  const data = await linearGraphql<{
    team: {
      issues: { nodes: LinearIssueListItem[] };
    } | null;
  }>(
    args.apiKey,
    `query TeamIssues($teamId: String!, $filter: IssueFilter, $first: Int!) {
      team(id: $teamId) {
        issues(
          first: $first
          filter: $filter
          orderBy: updatedAt
        ) {
          nodes {
            id
            identifier
            title
            url
            updatedAt
            state { id name type color }
            assignee { id name displayName avatarUrl }
            cycle { id name number }
          }
        }
      }
    }`,
    {
      teamId: args.teamId,
      first,
      filter: buildIssueFilterObject(args.scope, activeCycle?.id),
    },
  );

  return {
    issues: data.team?.issues.nodes ?? [],
    activeCycle,
  };
}

export async function getLinearIssueDetail(
  apiKey: string,
  identifier: string,
): Promise<LinearIssueDetail> {
  const { teamKey, number, identifier: normalized } =
    parseLinearIssueIdentifier(identifier);
  // `issueSearch` is deprecated — look up by team key + number instead.
  const data = await linearGraphql<{
    issues: { nodes: LinearIssueDetail[] };
  }>(
    apiKey,
    `query IssueDetail($teamKey: String!, $number: Float!) {
      issues(
        first: 1
        filter: {
          team: { key: { eq: $teamKey } }
          number: { eq: $number }
        }
      ) {
        nodes {
          id
          identifier
          title
          url
          description
          createdAt
          updatedAt
          state { id name type color }
          assignee { id name displayName avatarUrl }
          cycle { id name number }
          team {
            id
            name
            key
            states {
              nodes { id name type color position }
            }
          }
        }
      }
    }`,
    { teamKey, number },
  );

  const issue = data.issues.nodes.find(
    (node) => node.identifier.toUpperCase() === normalized,
  );
  if (!issue) {
    throw new Error(`Linear issue ${normalized} was not found`);
  }

  const states = [...(issue.team.states.nodes ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  return {
    ...issue,
    team: {
      ...issue.team,
      states: { nodes: states },
    },
  };
}

export async function createLinearIssue(args: {
  apiKey: string;
  teamId: string;
  title: string;
  description?: string;
  cycleId?: string;
  assigneeId?: string;
  stateId?: string;
}): Promise<LinearIssueListItem> {
  const input: Record<string, unknown> = {
    teamId: args.teamId,
    title: args.title,
  };
  if (args.description?.trim()) {
    input.description = args.description.trim();
  }
  if (args.cycleId) {
    input.cycleId = args.cycleId;
  }
  if (args.assigneeId) {
    input.assigneeId = args.assigneeId;
  }
  if (args.stateId) {
    input.stateId = args.stateId;
  }

  const data = await linearGraphql<{
    issueCreate: {
      success: boolean;
      issue: LinearIssueListItem | null;
    };
  }>(
    args.apiKey,
    `mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          title
          url
          updatedAt
          state { id name type color }
          assignee { id name displayName avatarUrl }
          cycle { id name number }
        }
      }
    }`,
    { input },
  );

  if (!data.issueCreate.success || !data.issueCreate.issue) {
    throw new Error("Linear could not create the issue");
  }
  return data.issueCreate.issue;
}

export async function updateLinearIssue(args: {
  apiKey: string;
  issueId: string;
  stateId?: string;
  /** Pass null to unassign */
  assigneeId?: string | null;
}): Promise<{
  state?: { id: string; name: string; type: string; color?: string };
  assignee?: LinearAssignee | null;
}> {
  const input: Record<string, unknown> = {};
  if (args.stateId) {
    input.stateId = args.stateId;
  }
  if (args.assigneeId !== undefined) {
    input.assigneeId = args.assigneeId;
  }
  if (Object.keys(input).length === 0) {
    throw new Error("Nothing to update");
  }

  const data = await linearGraphql<{
    issueUpdate: {
      success: boolean;
      issue?: {
        state?: { id: string; name: string; type: string; color?: string };
        assignee?: LinearAssignee | null;
      };
    };
  }>(
    args.apiKey,
    `mutation IssueUpdateFields($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success
        issue {
          state { id name type color }
          assignee { id name displayName avatarUrl }
        }
      }
    }`,
    { id: args.issueId, input },
  );

  if (!data.issueUpdate.success) {
    throw new Error("Linear could not update the issue");
  }

  return {
    state: data.issueUpdate.issue?.state,
    assignee: data.issueUpdate.issue?.assignee ?? null,
  };
}
