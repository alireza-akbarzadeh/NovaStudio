import { NextResponse } from "next/server";

import {
  callWorkspaceMcpTool,
  parseMcpToolCall,
  WORKSPACE_MCP_TOOLS,
} from "@/lib/ai/agent-bridge/mcp-handler";

type RouteContext = {
  params: Promise<{ runId: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const jobToken = request.headers.get("x-agent-job-token")?.trim();
  if (!runId || !jobToken) {
    return unauthorized();
  }

  return NextResponse.json({
    name: "novastudio-workspace",
    runId,
    tools: WORKSPACE_MCP_TOOLS,
    usage: {
      call: `POST /api/mcp/workspace/${runId}`,
      headers: {
        "Content-Type": "application/json",
        "x-agent-job-token": jobToken,
      },
      body: { name: "readFile", arguments: { path: "src/index.ts" } },
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params;
    const jobToken = request.headers.get("x-agent-job-token")?.trim();
    if (!runId || !jobToken) {
      return unauthorized();
    }

    const body = parseMcpToolCall(await request.json());
    const result = await callWorkspaceMcpTool(
      runId,
      jobToken,
      body.name,
      body.arguments,
    );

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MCP tool call failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
