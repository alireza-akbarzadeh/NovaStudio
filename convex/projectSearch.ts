import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { internal } from "./_generated/api";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { syncSearchLinesForFile } from "./lib/projectFileSearchIndex";
import { verifyProjectAccess } from "./lib/projectFiles";
import {
  matchesPathPrefix,
  searchFileContent,
  searchLineText,
  type ContentSearchMatch,
} from "./lib/searchInContent";

type SearchResult = {
  matches: ContentSearchMatch[];
  truncated: boolean;
};

const searchMatchValidator = v.object({
  path: v.string(),
  line: v.number(),
  column: v.number(),
  lineText: v.string(),
  matchStart: v.number(),
  matchEnd: v.number(),
});

export const assertSearchAccess = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await verifyProjectAccess(ctx, args.projectId);
    return true;
  },
});

export const hasSearchIndex = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("projectFileSearchLines")
      .withIndex("by_project_path", (q) => q.eq("projectId", args.projectId))
      .first();
    return row !== null;
  },
});

export const searchFromIndex = internalQuery({
  args: {
    projectId: v.id("projects"),
    query: v.string(),
    caseSensitive: v.boolean(),
    pathPrefix: v.optional(v.string()),
    maxMatches: v.number(),
  },
  handler: async (ctx, args) => {
    const trimmed = args.query.trim();
    if (trimmed.length < 2) {
      return { matches: [] as ContentSearchMatch[], truncated: false };
    }

    const candidates = await ctx.db
      .query("projectFileSearchLines")
      .withSearchIndex("search_line_text", (q) =>
        q.search("lineText", trimmed).eq("projectId", args.projectId),
      )
      .take(Math.max(args.maxMatches * 3, 60));

    const matches: ContentSearchMatch[] = [];
    for (const row of candidates) {
      if (
        args.pathPrefix &&
        !matchesPathPrefix(row.path, args.pathPrefix)
      ) {
        continue;
      }

      const lineMatches = searchLineText(
        row.path,
        row.line,
        row.lineText,
        trimmed,
        args.caseSensitive,
      );
      for (const match of lineMatches) {
        matches.push(match);
        if (matches.length >= args.maxMatches) {
          return { matches, truncated: true };
        }
      }
    }

    return { matches, truncated: false };
  },
});

export const scanContentPage = internalQuery({
  args: {
    projectId: v.id("projects"),
    paginationOpts: paginationOptsValidator,
    query: v.string(),
    caseSensitive: v.boolean(),
    pathPrefix: v.optional(v.string()),
    maxMatches: v.number(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("projectFileContents")
      .withIndex("by_project_path", (q) => q.eq("projectId", args.projectId))
      .paginate(args.paginationOpts);

    const matches: ContentSearchMatch[] = [];
    let truncated = false;

    for (const file of page.page) {
      if (args.pathPrefix && !matchesPathPrefix(file.path, args.pathPrefix)) {
        continue;
      }

      const remaining = args.maxMatches - matches.length;
      if (remaining <= 0) {
        truncated = true;
        break;
      }

      const fileMatches = searchFileContent(file.path, file.content, args.query, {
        caseSensitive: args.caseSensitive,
        maxMatches: remaining,
      });
      matches.push(...fileMatches);
      if (matches.length >= args.maxMatches) {
        truncated = true;
        break;
      }
    }

    return {
      matches,
      truncated,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    };
  },
});

export const searchInProject = action({
  args: {
    projectId: v.id("projects"),
    query: v.string(),
    caseSensitive: v.optional(v.boolean()),
    pathPrefix: v.optional(v.string()),
    maxMatches: v.optional(v.number()),
  },
  returns: v.object({
    matches: v.array(searchMatchValidator),
    truncated: v.boolean(),
  }),
  handler: async (ctx, args): Promise<SearchResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    await ctx.runQuery(internal.projectSearch.assertSearchAccess, {
      projectId: args.projectId,
    });

    const trimmed = args.query.trim();
    if (!trimmed) {
      return { matches: [], truncated: false };
    }

    const caseSensitive = args.caseSensitive ?? false;
    const maxMatches = args.maxMatches ?? 200;
    const pathPrefix = args.pathPrefix?.replace(/\/$/, "") || undefined;

    const indexed = await ctx.runQuery(internal.projectSearch.hasSearchIndex, {
      projectId: args.projectId,
    });

    if (indexed) {
      const indexResult: SearchResult = await ctx.runQuery(
        internal.projectSearch.searchFromIndex,
        {
          projectId: args.projectId,
          query: trimmed,
          caseSensitive,
          pathPrefix,
          maxMatches,
        },
      );
      if (indexResult.matches.length > 0) {
        return indexResult;
      }
    }

    const matches: ContentSearchMatch[] = [];
    let cursor: string | null = null;
    let truncated = false;

    while (matches.length < maxMatches) {
      const page: SearchResult & {
        continueCursor: string;
        isDone: boolean;
      } = await ctx.runQuery(internal.projectSearch.scanContentPage, {
        projectId: args.projectId,
        paginationOpts: {
          numItems: 40,
          cursor,
        },
        query: trimmed,
        caseSensitive,
        pathPrefix,
        maxMatches: maxMatches - matches.length,
      });

      matches.push(...page.matches);
      truncated = page.truncated;

      if (truncated || page.isDone) {
        break;
      }
      cursor = page.continueCursor;
    }

    return {
      matches: matches.slice(0, maxMatches),
      truncated: truncated || matches.length >= maxMatches,
    };
  },
});

/** Backfill search index after bulk import (batched). */
export const indexSearchLinesBatch = internalMutation({
  args: {
    projectId: v.id("projects"),
    cursor: v.optional(v.string()),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("projectFileContents")
      .withIndex("by_project_path", (q) => q.eq("projectId", args.projectId))
      .paginate({
        numItems: args.limit,
        cursor: args.cursor ?? null,
      });

    for (const file of page.page) {
      await syncSearchLinesForFile(
        ctx,
        args.projectId,
        file.path,
        file.content,
      );
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.projectSearch.indexSearchLinesBatch, {
        projectId: args.projectId,
        cursor: page.continueCursor,
        limit: args.limit,
      });
    }
  },
});

export const scheduleSearchIndexBackfill = internalMutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.projectSearch.indexSearchLinesBatch, {
      projectId: args.projectId,
      limit: 15,
    });
  },
});
