import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { BLOG_SEED_POSTS, blogCategory } from "./lib/blogSeed";

/** Public — list published posts, newest first. Optional category filter. */
export const list = query({
  args: {
    category: v.optional(blogCategory),
  },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("blogPosts")
        .withIndex("by_category_published", (q) =>
          q.eq("category", args.category!).eq("published", true),
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("blogPosts")
      .withIndex("by_published_publishedAt", (q) => q.eq("published", true))
      .order("desc")
      .collect();
  },
});

/** Public — featured published post (or null). */
export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    const featured = await ctx.db
      .query("blogPosts")
      .withIndex("by_featured_published", (q) =>
        q.eq("featured", true).eq("published", true),
      )
      .order("desc")
      .first();
    return featured ?? null;
  },
});

/** Public — single post by slug. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!post || !post.published) return null;
    return post;
  },
});

/**
 * Idempotent seed for marketing posts. Safe to call from the client when
 * the blog is empty (e.g. first deploy).
 */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    for (const post of BLOG_SEED_POSTS) {
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", post.slug))
        .unique();
      if (existing) continue;
      await ctx.db.insert("blogPosts", { ...post });
      inserted += 1;
    }
    return { inserted };
  },
});
