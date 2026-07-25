import { inngest } from "@/integration/inngest/client";
import { blocking } from "@/integration/inngest/functions";
import { cloneFromGitHubJob } from "@/integration/inngest/functions/clone-from-github";
import { serve } from "inngest/next";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [blocking, cloneFromGitHubJob],
});
