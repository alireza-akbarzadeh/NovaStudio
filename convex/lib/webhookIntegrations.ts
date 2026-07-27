export type WebhookProvider = "slack" | "discord";

export function isValidSlackWebhookUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "hooks.slack.com" &&
      parsed.pathname.startsWith("/services/")
    );
  } catch {
    return false;
  }
}

export function isValidDiscordWebhookUrl(url: string) {
  try {
    const parsed = new URL(url.trim());
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "discord.com" ||
        parsed.hostname === "discordapp.com") &&
      parsed.pathname.startsWith("/api/webhooks/")
    );
  } catch {
    return false;
  }
}

export function validateWebhookUrl(provider: WebhookProvider, url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    throw new Error("Paste an incoming webhook URL");
  }
  if (provider === "slack" && !isValidSlackWebhookUrl(trimmed)) {
    throw new Error(
      "Invalid Slack webhook — use an Incoming Webhook URL from hooks.slack.com",
    );
  }
  if (provider === "discord" && !isValidDiscordWebhookUrl(trimmed)) {
    throw new Error(
      "Invalid Discord webhook — use a channel webhook URL from discord.com/api/webhooks",
    );
  }
  return trimmed;
}

export async function sendSlackWebhook(
  webhookUrl: string,
  text: string,
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Slack webhook failed (${response.status})`);
  }
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  payload: {
    content?: string;
    embeds?: Array<{
      title?: string;
      description?: string;
      color?: number;
      url?: string;
    }>;
  },
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Discord webhook failed (${response.status})`);
  }
}

export async function verifyWebhookConnection(
  provider: WebhookProvider,
  webhookUrl: string,
): Promise<{ channelLabel?: string }> {
  const label =
    provider === "slack" ? "NovaStudio" : "NovaStudio notifications";

  if (provider === "slack") {
    await sendSlackWebhook(
      webhookUrl,
      "✅ *NovaStudio connected* — deploy success and failure alerts will post here.",
    );
    return { channelLabel: label };
  }

  await sendDiscordWebhook(webhookUrl, {
    embeds: [
      {
        title: "NovaStudio connected",
        description:
          "Deploy success and failure alerts from your workspace will post here.",
        color: 0x5b21b6,
      },
    ],
  });
  return { channelLabel: label };
}

export async function sendDeployWebhookNotification(args: {
  provider: WebhookProvider;
  webhookUrl: string;
  deployProvider: "vercel" | "netlify";
  projectName: string;
  status: "ready" | "error";
  url?: string;
  inspectorUrl?: string;
  errorMessage?: string;
}) {
  const deployName = args.deployProvider === "netlify" ? "Netlify" : "Vercel";
  const succeeded = args.status === "ready";
  const headline = succeeded
    ? `${deployName} deploy succeeded`
    : `${deployName} deploy failed`;
  const link = succeeded
    ? args.url
    : args.inspectorUrl ?? args.url;

  if (args.provider === "slack") {
    const lines = [
      succeeded ? "🚀" : "⚠️",
      `*${headline}*`,
      `Project: *${args.projectName}*`,
    ];
    if (link) lines.push(`<${link}|Open ${succeeded ? "site" : "logs"}>`);
    if (!succeeded && args.errorMessage) {
      lines.push(`\n_${args.errorMessage.slice(0, 280)}_`);
    }
    await sendSlackWebhook(args.webhookUrl, lines.join("\n"));
    return;
  }

  await sendDiscordWebhook(args.webhookUrl, {
    embeds: [
      {
        title: headline,
        description: [
          `**${args.projectName}**`,
          !succeeded && args.errorMessage
            ? args.errorMessage.slice(0, 500)
            : succeeded
              ? "Your preview or production deploy is live."
              : "Open the provider dashboard for build logs.",
        ]
          .filter(Boolean)
          .join("\n"),
        color: succeeded ? 0x059669 : 0xdc2626,
        url: link,
      },
    ],
  });
}
