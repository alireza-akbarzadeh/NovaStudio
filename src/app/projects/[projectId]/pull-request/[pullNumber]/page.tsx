import { PullRequestView } from "@/features/workspace/views/pull-request-view";

export default async function ProjectPullRequestPage({
  params,
}: {
  params: Promise<{ projectId: string; pullNumber: string }>;
}) {
  const { projectId, pullNumber } = await params;
  const parsed = Number.parseInt(pullNumber, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null;
  }

  return <PullRequestView projectId={projectId} pullNumber={parsed} />;
}
