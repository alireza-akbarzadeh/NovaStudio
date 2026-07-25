import { ConvexHttpClient } from "convex/browser";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/integration/inngest/client";

type CloneRequestedData = {
  projectId: string;
  jobToken: string;
};

export const cloneFromGitHubJob = inngest.createFunction(
  {
    id: "project-clone-from-github",
    triggers: [{ event: "project/clone.requested" }],
    retries: 2,
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
