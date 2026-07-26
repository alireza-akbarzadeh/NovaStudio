import { v } from "convex/values";

import { mutation } from "./_generated/server";

const contactTopic = v.union(
  v.literal("General"),
  v.literal("Sales"),
  v.literal("Support"),
  v.literal("Press"),
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function assertEmail(email: string) {
  const normalized = normalizeEmail(email);
  if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
    throw new Error("Please enter a valid email address.");
  }
  return normalized;
}

/** Public contact form — no auth required. */
export const submitMessage = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    topic: contactTopic,
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const message = args.message.trim();
    const company = args.company?.trim();
    const email = assertEmail(args.email);

    if (name.length < 1 || name.length > 120) {
      throw new Error("Please enter your name.");
    }
    if (message.length < 1 || message.length > 5000) {
      throw new Error("Please enter a message (up to 5000 characters).");
    }
    if (company && company.length > 160) {
      throw new Error("Company name is too long.");
    }

    return await ctx.db.insert("contactMessages", {
      name,
      email,
      company: company || undefined,
      topic: args.topic,
      message,
      createdAt: Date.now(),
    });
  },
});
