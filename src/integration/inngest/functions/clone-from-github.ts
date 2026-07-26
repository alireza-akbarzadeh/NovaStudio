import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/integration/inngest/client";

type CloneRequestedData = {
  projectId: string;
  jobToken: string;
};

async function markCloneFailed(
  projectId: string,
  jobToken: string,
  reason: string,
) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return;
  const convex = new ConvexHttpClient(convexUrl);
  try {
    await convex.mutation(api.githubImportMutations.failImportWithToken, {
      projectId: projectId as Id<"projects">,
      jobToken,
      reason,
    });
  } catch {
    // Best-effort — client watchdog can also expire the job.
  }
}

export const cloneFromGitHubJob = inngest.createFunction(
  {
    id: "project-clone-from-github",
    triggers: [{ event: "project/clone.requested" }],
    retries: 2,
    // Hard ceiling so clones cannot sit running for hours.
    timeouts: {
      finish: "5m",
    },
    onFailure: async ({ event }) => {
      const root = event.data as {
        event?: { data?: CloneRequestedData };
        projectId?: string;
        jobToken?: string;
      };
      const payload: CloneRequestedData | undefined =
        root.event?.data ??
        (root.projectId && root.jobToken
          ? { projectId: root.projectId, jobToken: root.jobToken }
          : undefined);
      if (!payload?.projectId || !payload.jobToken) return;
      await markCloneFailed(
        payload.projectId,
        payload.jobToken,
        "The GitHub clone job failed after retries. You can retry from the project card.",
      );
    },
  },
  async ({ event, step }) => {
    const { projectId, jobToken } = event.data as CloneRequestedData;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
    }

    const result = await step.run("import-repository", async () => {
      const convex = new ConvexHttpClient(convexUrl);
      return await convex.action(api.githubImport.processCloneJob, {
        projectId: projectId as Id<"projects">,
        jobToken,
      });
    });

    return result;
  },
);
