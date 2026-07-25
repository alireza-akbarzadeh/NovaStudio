import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/integration/inngest/client";

export async function POST(request: Request) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      projectId?: string;
      jobToken?: string;
    };
    const projectId = body.projectId?.trim();
    const jobToken = body.jobToken?.trim();
    if (!projectId || !jobToken) {
      return NextResponse.json(
        { error: "Missing projectId or jobToken" },
        { status: 400 },
      );
    }

    const convexToken = await getToken({ template: "convex" });
    if (!convexToken) {
      return NextResponse.json(
        { error: "Missing Convex auth token" },
        { status: 401 },
      );
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 },
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    convex.setAuth(convexToken);

    const project = await convex.query(api.projects.getProjectById, {
      projectId: projectId as Id<"projects">,
    });

    if (!project || project.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (project.importStatus !== "importing") {
      return NextResponse.json(
        { error: "Project is not awaiting import" },
        { status: 409 },
      );
    }

    await inngest.send({
      name: "project/clone.requested",
      data: { projectId, jobToken },
    });

    return NextResponse.json({ ok: true, projectId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to queue clone job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
