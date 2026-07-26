import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

const panelSizesValidator = v.object({
  sidebar: v.number(),
  terminal: v.number(),
  ai: v.optional(v.number()),
});

export const editorSettingsValidator = v.object({
  fontSize: v.number(),
  tabSize: v.number(),
  wordWrap: v.boolean(),
  lineNumbers: v.boolean(),
  highlightActiveLine: v.boolean(),
  bracketMatching: v.boolean(),
  lineHeight: v.number(),
  formatOnSave: v.optional(v.boolean()),
  autoSave: v.optional(v.boolean()),
  formatOnSaveAll: v.optional(v.boolean()),
  liveCollaboration: v.optional(v.boolean()),
});

const SETTINGS_JSON_MAX_CHARS = 32_000;

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    return await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    sidebarOpen: v.boolean(),
    terminalOpen: v.boolean(),
    aiPanelOpen: v.boolean(),
    panelSizes: panelSizesValidator,
    editor: v.optional(editorSettingsValidator),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const payload = {
      userId: identity.subject,
      sidebarOpen: args.sidebarOpen,
      terminalOpen: args.terminalOpen,
      aiPanelOpen: args.aiPanelOpen,
      panelSizes: {
        sidebar: args.panelSizes.sidebar,
        terminal: args.panelSizes.terminal,
        ai: args.panelSizes.ai ?? 28,
      },
      ...(args.editor ? { editor: args.editor } : {}),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("userPreferences", payload);
  },
});

export const upsertEditor = mutation({
  args: {
    editor: editorSettingsValidator,
    /** When provided, keeps settings.json in sync with the form. */
    settingsJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (
      args.settingsJson !== undefined &&
      args.settingsJson.length > SETTINGS_JSON_MAX_CHARS
    ) {
      throw new Error("settings.json is too large");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const patch = {
      editor: args.editor,
      ...(args.settingsJson !== undefined
        ? { settingsJson: args.settingsJson }
        : {}),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("userPreferences", {
      userId: identity.subject,
      sidebarOpen: true,
      terminalOpen: false,
      aiPanelOpen: true,
      panelSizes: { sidebar: 18, terminal: 28, ai: 28 },
      editor: args.editor,
      ...(args.settingsJson !== undefined
        ? { settingsJson: args.settingsJson }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

/** Save a VS Code–style settings.json document for the signed-in user. */
export const upsertSettingsJson = mutation({
  args: {
    settingsJson: v.string(),
    /** Parsed known keys applied to typed editor prefs. */
    editor: v.optional(editorSettingsValidator),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    if (args.settingsJson.length > SETTINGS_JSON_MAX_CHARS) {
      throw new Error("settings.json is too large (max 32KB)");
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .unique();

    const patch = {
      settingsJson: args.settingsJson,
      ...(args.editor ? { editor: args.editor } : {}),
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("userPreferences", {
      userId: identity.subject,
      sidebarOpen: true,
      terminalOpen: false,
      aiPanelOpen: true,
      panelSizes: { sidebar: 18, terminal: 28, ai: 28 },
      settingsJson: args.settingsJson,
      ...(args.editor ? { editor: args.editor } : {}),
      updatedAt: Date.now(),
    });
  },
});
