export type CustomizeUserItemKind = "subagent" | "hook" | "command" | "rule";

export type CustomizeUserItem = {
  _id: string;
  kind: CustomizeUserItemKind;
  name: string;
  description: string;
  content: string;
  hookPhase?: "pre" | "post";
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export const CUSTOMIZE_USER_ITEM_META: Record<
  CustomizeUserItemKind,
  {
    label: string;
    singular: string;
    addLabel: string;
    contentLabel: string;
    contentPlaceholder: string;
    descriptionPlaceholder: string;
  }
> = {
  subagent: {
    label: "Subagents",
    singular: "Subagent",
    addLabel: "Add subagent",
    contentLabel: "System instructions",
    contentPlaceholder:
      "You are a security-focused reviewer. Always check for XSS, auth gaps, and unsafe defaults…",
    descriptionPlaceholder: "Short label shown in Customize and AI context",
  },
  hook: {
    label: "Hooks",
    singular: "Hook",
    addLabel: "Add hook",
    contentLabel: "Hook instructions",
    contentPlaceholder:
      "Before answering, list assumptions. After answering, suggest one follow-up test…",
    descriptionPlaceholder: "When this hook runs (pre- or post-response)",
  },
  command: {
    label: "Commands",
    singular: "Command",
    addLabel: "Add command",
    contentLabel: "Prompt template",
    contentPlaceholder:
      "Review the active file for accessibility issues and propose concrete fixes…",
    descriptionPlaceholder: "What this command does when inserted into chat",
  },
  rule: {
    label: "Custom rules",
    singular: "Rule",
    addLabel: "Add rule",
    contentLabel: "Rule text",
    contentPlaceholder:
      "Always use TypeScript strict mode patterns. Prefer server components in Next.js app router…",
    descriptionPlaceholder: "Always-on guidance appended to NovaStudio AI",
  },
};

export type AiCustomizeContext = {
  rules: string[];
  preHooks: string[];
  postHooks: string[];
  subagents: Array<{ name: string; content: string }>;
};

export function buildAiCustomizeContext(
  items: CustomizeUserItem[],
): AiCustomizeContext {
  const enabled = items.filter((item) => item.enabled);

  return {
    rules: enabled
      .filter((item) => item.kind === "rule")
      .map((item) => item.content),
    preHooks: enabled
      .filter((item) => item.kind === "hook" && item.hookPhase === "pre")
      .map((item) => item.content),
    postHooks: enabled
      .filter((item) => item.kind === "hook" && item.hookPhase === "post")
      .map((item) => item.content),
    subagents: enabled
      .filter((item) => item.kind === "subagent")
      .map((item) => ({ name: item.name, content: item.content })),
  };
}

export function formatAiCustomizePrompt(context: AiCustomizeContext): string[] {
  const sections: string[] = [];

  if (context.rules.length > 0) {
    sections.push(
      `User rules (always follow):\n${context.rules.map((rule) => `- ${rule}`).join("\n")}`,
    );
  }

  if (context.preHooks.length > 0) {
    sections.push(
      `Pre-response hooks:\n${context.preHooks.map((hook) => `- ${hook}`).join("\n")}`,
    );
  }

  if (context.subagents.length > 0) {
    sections.push(
      `Active subagent personas:\n${context.subagents
        .map(
          (agent) =>
            `### ${agent.name}\n${agent.content}`,
        )
        .join("\n\n")}`,
    );
  }

  if (context.postHooks.length > 0) {
    sections.push(
      `When finishing your reply, also:\n${context.postHooks.map((hook) => `- ${hook}`).join("\n")}`,
    );
  }

  return sections;
}
