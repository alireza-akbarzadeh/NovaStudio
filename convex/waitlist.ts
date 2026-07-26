import { v } from "convex/values";

import { mutation } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** Public waitlist / newsletter signup — no auth required. */
export const join = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    if (!EMAIL_RE.test(email) || email.length > 254) {
      throw new Error("Please enter a valid email address.");
    }

    const name = args.name?.trim();
    if (name && name.length > 120) {
      throw new Error("Name is too long.");
    }

    const source = args.source?.trim();
    if (source && source.length > 80) {
      throw new Error("Invalid signup source.");
    }

    const existing = await ctx.db
      .query("waitlistSignups")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      return { id: existing._id, alreadyJoined: true as const };
    }

    const id = await ctx.db.insert("waitlistSignups", {
      email,
      name: name || undefined,
      source: source || undefined,
      createdAt: Date.now(),
    });

    return { id, alreadyJoined: false as const };
  },
});
