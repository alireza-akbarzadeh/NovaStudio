"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

const transportValidator = v.union(v.literal("sse"), v.literal("http"));

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Paste an MCP server URL");
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a valid URL (https://…)");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("MCP URL must start with http:// or https://");
  }
  return url.toString().replace(/\/+$/, "");
}

async function probeMcpUrl(url: string, authHeader?: string) {
  const headers: Record<string, string> = {
    Accept: "text/event-stream, application/json, */*",
  };
  const token = authHeader?.trim();
  if (token) {
    headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    if (res.status >= 500) {
      throw new Error(`Server error (${res.status}) — check the MCP URL`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Unauthorized — check your auth token / header");
    }
    if (res.status >= 400) {
      throw new Error(`Could not reach MCP server (${res.status})`);
    }

    return {
      ok: true as const,
      status: res.status,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Connection timed out — is the MCP server running?");
    }
    throw error instanceof Error
      ? error
      : new Error("Could not connect to MCP server");
  } finally {
    clearTimeout(timer);
  }
}

export const connect = action({
  args: {
    name: v.string(),
    transport: transportValidator,
    url: v.string(),
    authHeader: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ connected: true; serverId: Id<"userMcpServers"> }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to add an MCP server");
    }

    const name = args.name.trim();
    if (!name) {
      throw new Error("Enter a display name");
    }
    if (name.length > 80) {
      throw new Error("Name is too long (max 80 characters)");
    }

    const url = normalizeUrl(args.url);
    const authHeader = args.authHeader?.trim() || undefined;

    await probeMcpUrl(url, authHeader);

    const serverId = (await ctx.runMutation(
      internal.userMcpServers.upsertFromConnect,
      {
        userId: identity.subject,
        name,
        transport: args.transport,
        url,
        authHeader,
      },
    )) as Id<"userMcpServers">;

    return { connected: true as const, serverId };
  },
});
