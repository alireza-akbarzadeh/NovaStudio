/**
 * Transactional email via Resend (https://resend.com).
 *
 * Convex env:
 *   RESEND_API_KEY   — required to send
 *   RESEND_FROM      — e.g. "NovaStudio <invites@yourdomain.com>"
 *   APP_ORIGIN       — e.g. "https://app.novastudio.app" (no trailing slash)
 */

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_configured" | "failed"; detail?: string };

function appOrigin() {
  const raw =
    process.env.APP_ORIGIN?.trim() ||
    process.env.SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

export function resolveAppOrigin() {
  return appOrigin();
}

export function inviteAbsoluteUrl(token: string) {
  const origin = appOrigin();
  if (!origin) {
    return `/invite/${token}`;
  }
  return `${origin}/invite/${token}`;
}

export function projectAbsoluteUrl(projectId: string) {
  const origin = appOrigin();
  if (!origin) {
    return `/projects/${projectId}`;
  }
  return `${origin}/projects/${projectId}`;
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, reason: "not_configured" };
  }

  const from =
    process.env.RESEND_FROM?.trim() || "NovaStudio <onboarding@resend.dev>";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, reason: "failed", detail };
  }

  const body = (await response.json()) as { id?: string };
  return { ok: true, id: body.id ?? "sent" };
}

export function projectInviteEmail(opts: {
  projectName: string;
  role: "editor" | "viewer";
  inviterName: string;
  inviteUrl: string;
}) {
  const roleLabel = opts.role === "editor" ? "can edit" : "can view";
  const subject = `${opts.inviterName} invited you to ${opts.projectName} on NovaStudio`;
  const text = [
    `${opts.inviterName} invited you to collaborate on "${opts.projectName}" (${roleLabel}).`,
    "",
    `Accept the invite: ${opts.inviteUrl}`,
    "",
    "If you don't have an account yet, you'll create one when you open the link.",
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px">
      <h1 style="font-size:20px;margin:0 0 12px">You're invited to collaborate</h1>
      <p style="margin:0 0 12px">
        <strong>${escapeHtml(opts.inviterName)}</strong> invited you to
        <strong>${escapeHtml(opts.projectName)}</strong> on NovaStudio
        (<em>${roleLabel}</em>).
      </p>
      <p style="margin:0 0 20px">
        <a href="${escapeAttr(opts.inviteUrl)}"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
          Accept invite
        </a>
      </p>
      <p style="margin:0;font-size:13px;color:#666">
        Or open this link:<br/>
        <a href="${escapeAttr(opts.inviteUrl)}" style="color:#7c3aed;word-break:break-all">${escapeHtml(opts.inviteUrl)}</a>
      </p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function projectAddedEmail(opts: {
  projectName: string;
  role: "editor" | "viewer";
  inviterName: string;
  projectUrl: string;
}) {
  const roleLabel = opts.role === "editor" ? "can edit" : "can view";
  const subject = `You've been added to ${opts.projectName} on NovaStudio`;
  const text = [
    `${opts.inviterName} added you to "${opts.projectName}" (${roleLabel}).`,
    "",
    `Open the project: ${opts.projectUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.5;color:#111;max-width:520px">
      <h1 style="font-size:20px;margin:0 0 12px">You've been added to a project</h1>
      <p style="margin:0 0 12px">
        <strong>${escapeHtml(opts.inviterName)}</strong> added you to
        <strong>${escapeHtml(opts.projectName)}</strong>
        (<em>${roleLabel}</em>).
      </p>
      <p style="margin:0 0 20px">
        <a href="${escapeAttr(opts.projectUrl)}"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600">
          Open project
        </a>
      </p>
    </div>
  `.trim();

  return { subject, text, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
