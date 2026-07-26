import { ActivityDiffView } from "@/features/workspace/views/activity-diff-view";

export default async function ProjectTimelineDiffPage({
  params,
}: {
  params: Promise<{ projectId: string; activityId: string }>;
}) {
  const { projectId, activityId } = await params;

  return (
    <ActivityDiffView projectId={projectId} activityId={activityId} />
  );
}
