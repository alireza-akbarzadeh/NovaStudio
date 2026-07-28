export type LocalCliBridgeConfig = {
  origin: string;
  runId: string;
  jobToken: string;
  projectName?: string;
};

export function buildMcpBridgeUrl(origin: string, runId: string) {
  return `${origin.replace(/\/$/, "")}/api/mcp/workspace/${runId}`;
}

export function buildBridgeEnvSnippet(config: LocalCliBridgeConfig) {
  const url = buildMcpBridgeUrl(config.origin, config.runId);
  return `# NovaStudio cloud workspace bridge
export NOVASTUDIO_MCP_URL="${url}"
export NOVASTUDIO_JOB_TOKEN="${config.jobToken}"`;
}

export function buildCurlTestSnippet(config: LocalCliBridgeConfig) {
  const url = buildMcpBridgeUrl(config.origin, config.runId);
  return `# List available tools
curl -s "${url}" \\
  -H "x-agent-job-token: ${config.jobToken}"

# Read a file from the cloud project
curl -s -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "x-agent-job-token: ${config.jobToken}" \\
  -d '{"name":"readFile","arguments":{"path":"package.json"}}'

# Propose a file change (queued for review in NovaStudio)
curl -s -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "x-agent-job-token: ${config.jobToken}" \\
  -d '{"name":"writeFile","arguments":{"path":"README.md","content":"# Updated from local CLI\\n"}}'`;
}

/** Cursor / Claude-style mcp.json for HTTP bridge (streamable HTTP when supported). */
export function buildMcpJson(config: LocalCliBridgeConfig) {
  const url = buildMcpBridgeUrl(config.origin, config.runId);
  return JSON.stringify(
    {
      mcpServers: {
        novastudio: {
          url,
          headers: {
            "x-agent-job-token": config.jobToken,
          },
        },
      },
    },
    null,
    2,
  );
}

export function buildCursorCliSnippet(config: LocalCliBridgeConfig) {
  const url = buildMcpBridgeUrl(config.origin, config.runId);
  return `# 1. Save MCP config (optional — if your Cursor build supports HTTP MCP)
mkdir -p .cursor
cat > .cursor/mcp.json <<'EOF'
${buildMcpJson(config)}
EOF

# 2. Run Cursor CLI against the cloud project bridge
export NOVASTUDIO_MCP_URL="${url}"
export NOVASTUDIO_JOB_TOKEN="${config.jobToken}"
agent -p "List project files via NovaStudio MCP, then summarize the codebase."`;
}

export function buildOpenClawSnippet(config: LocalCliBridgeConfig) {
  const url = buildMcpBridgeUrl(config.origin, config.runId);
  return `# OpenClaw: point a coding skill at the NovaStudio bridge
openclaw agent --local --message "Use NovaStudio bridge at ${url} with x-agent-job-token header to read and edit the cloud project."`;
}

export function buildBridgeReadme(config: LocalCliBridgeConfig) {
  const url = buildMcpBridgeUrl(config.origin, config.runId);
  return `NovaStudio cloud bridge
Run id: ${config.runId}
Endpoint: ${url}
Header: x-agent-job-token: ${config.jobToken}

Tools: readFile, listFiles, writeFile
writeFile changes appear in NovaStudio for diff review — they are not applied immediately.`;
}
