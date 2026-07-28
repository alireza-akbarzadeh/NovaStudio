import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function seedPublicProjectContent(
  ctx: MutationCtx,
  projectId: Id<"projects">,
) {
  const existingTodos = await ctx.db
    .query("projectPublicTodos")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
  if (!existingTodos) {
    const defaults: Array<{
      title: string;
      status: "todo" | "in-progress" | "done";
      bountyAmount?: string;
      goodFirstIssue?: boolean;
    }> = [
      { title: "Polish onboarding flow", status: "in-progress" },
      {
        title: "Add contributor guidelines",
        status: "todo",
        bountyAmount: "$250",
        goodFirstIssue: true,
      },
      { title: "Ship v1 to production", status: "todo" },
    ];
    for (let i = 0; i < defaults.length; i += 1) {
      const item = defaults[i]!;
      await ctx.db.insert("projectPublicTodos", {
        projectId,
        title: item.title,
        status: item.status,
        bountyAmount: item.bountyAmount,
        goodFirstIssue: item.goodFirstIssue === true,
        sortOrder: i,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }

  const existingFeatures = await ctx.db
    .query("projectFeatureIdeas")
    .withIndex("by_project", (q) => q.eq("projectId", projectId))
    .first();
  if (!existingFeatures) {
    await ctx.db.insert("projectFeatureIdeas", {
      projectId,
      title: "Dark mode theme polish",
      description:
        "Improve contrast and component consistency across the app.",
      status: "open",
      upvotes: 3,
      createdAt: Date.now(),
    });
    await ctx.db.insert("projectFeatureIdeas", {
      projectId,
      title: "Public API documentation",
      description: "Auto-generated docs for community integrations.",
      status: "planned",
      upvotes: 5,
      createdAt: Date.now(),
    });
  }
}
