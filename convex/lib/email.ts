/**
 * Transactional email via Resend (https://resend.com).
 *
 * Convex env (required for invites to send):
 *   RESEND_API_KEY   — from resend.com
 *   RESEND_FROM      — e.g. "NovaStudio <onboarding@resend.dev>" (dev)
 *                      or "NovaStudio <invites@yourdomain.com>" (prod)
 *   APP_ORIGIN       — e.g. "http://localhost:3000" (no trailing slash)
 */

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: "not_configured" | "failed" | "testing_only"; detail?: string };

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

/** Turn Resend API error bodies into short, user-facing copy. */
export function formatResendError(detail?: string): string {
  if (!detail?.trim()) return "Failed to send email";

  try {
    const parsed = JSON.parse(detail) as {
      message?: string;
      name?: string;
      statusCode?: number;
    };
    const message = parsed.message?.trim();
    if (message) {
      if (/only send testing emails to your own email/i.test(message)) {
        return "Resend is in test mode — you can only email yourself until you verify a domain at resend.com/domains, then set RESEND_FROM to that domain.";
      }
      if (/verify a domain/i.test(message)) {
        return "Verify a domain at resend.com/domains, then set RESEND_FROM to an address on that domain.";
      }
      return message;
    }
  } catch {
    // plain text body
  }

  if (/only send testing emails to your own email/i.test(detail)) {
    return "Resend is in test mode — you can only email yourself until you verify a domain at resend.com/domains.";
  }

  return detail.length > 280 ? `${detail.slice(0, 277)}…` : detail;
}

function isResendTestingOnlyError(detail?: string) {
  return /only send testing emails to your own email|verify a domain/i.test(
    detail ?? "",
  );
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
    return {
      ok: false,
      reason: isResendTestingOnlyError(detail) ? "testing_only" : "failed",
      detail: formatResendError(detail),
    };
  }

  const body = (await response.json()) as { id?: string };
  return { ok: true, id: body.id ?? "sent" };
}

function roleLabel(role: "editor" | "viewer") {
  return role === "editor" ? "Can edit" : "Can view";
}

function roleHint(role: "editor" | "viewer") {
  return role === "editor"
    ? "Edit files, run the workspace, and collaborate in real time."
    : "Browse the project and leave comments — view only.";
}

/** Shared NovaStudio invite shell — dark ambient card, violet CTA. */
function renderEmailShell(opts: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote: string;
}) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>NovaStudio</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#06070d;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
    ${escapeHtml(opts.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06070d;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border-collapse:separate">
          <!-- Brand -->
          <tr>
            <td style="padding:0 0 20px;text-align:center">
              <span style="display:inline-block;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#a78bfa">
                NovaStudio
              </span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:linear-gradient(165deg,#12131c 0%,#0a0b14 55%,#0d0e18 100%);border:1px solid rgba(255,255,255,0.10);border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.55)">
              <!-- Accent bar -->
              <div style="height:3px;background:linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee)"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:36px 32px 28px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
                    <p style="margin:0 0 10px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#22d3ee">
                      ${escapeHtml(opts.eyebrow)}
                    </p>
                    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;letter-spacing:-0.02em;color:#ffffff">
                      ${escapeHtml(opts.title)}
                    </h1>
                    ${opts.bodyHtml}
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
                      <tr>
                        <td style="border-radius:12px;background:linear-gradient(135deg,#8b5cf6,#7c3aed)">
                          <a href="${escapeAttr(opts.ctaUrl)}"
                             style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.01em">
                            ${escapeHtml(opts.ctaLabel)}
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:18px 0 0;font-size:12px;line-height:1.55;color:rgba(255,255,255,0.40);word-break:break-all">
                      Or paste this link into your browser:<br/>
                      <a href="${escapeAttr(opts.ctaUrl)}" style="color:#a78bfa;text-decoration:none">${escapeHtml(opts.ctaUrl)}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px 0;text-align:center;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.38)">
                ${escapeHtml(opts.footerNote)}
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.28)">
                © ${year} NovaStudio · Cloud workspace for builders
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRows(rows: Array<{ label: string; value: string }>) {
  const cells = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:13px;color:rgba(255,255,255,0.45);width:110px;vertical-align:top">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.08);font-size:14px;font-weight:600;color:#ffffff;vertical-align:top">
            ${escapeHtml(row.value)}
          </td>
        </tr>`,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px;border-collapse:collapse">
      ${cells}
    </table>`;
}

export function projectInviteEmail(opts: {
  projectName: string;
  role: "editor" | "viewer";
  inviterName: string;
  inviteUrl: string;
}) {
  const access = roleLabel(opts.role);
  const subject = `${opts.inviterName} invited you to ${opts.projectName}`;
  const text = [
    `${opts.inviterName} invited you to collaborate on "${opts.projectName}" on NovaStudio.`,
    `Access: ${access}`,
    "",
    roleHint(opts.role),
    "",
    `Accept the invite: ${opts.inviteUrl}`,
    "",
    "If you don't have an account yet, you'll create one when you open the link.",
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72)">
      <strong style="color:#fff">${escapeHtml(opts.inviterName)}</strong>
      invited you to join
      <strong style="color:#fff">${escapeHtml(opts.projectName)}</strong>
      in their NovaStudio workspace.
    </p>
    ${detailRows([
      { label: "Project", value: opts.projectName },
      { label: "Access", value: access },
      { label: "From", value: opts.inviterName },
    ])}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:rgba(255,255,255,0.48)">
      ${escapeHtml(roleHint(opts.role))}
    </p>
  `;

  const html = renderEmailShell({
    preheader: `${opts.inviterName} invited you to ${opts.projectName} · ${access}`,
    eyebrow: "Project invite",
    title: "You're invited to collaborate",
    bodyHtml,
    ctaLabel: "Accept invite",
    ctaUrl: opts.inviteUrl,
    footerNote:
      "This invite link is unique to you. If you weren't expecting it, you can ignore this email.",
  });

  return { subject, text, html };
}

export function projectAddedEmail(opts: {
  projectName: string;
  role: "editor" | "viewer";
  inviterName: string;
  projectUrl: string;
}) {
  const access = roleLabel(opts.role);
  const subject = `You've been added to ${opts.projectName}`;
  const text = [
    `${opts.inviterName} added you to "${opts.projectName}" on NovaStudio.`,
    `Access: ${access}`,
    "",
    `Open the project: ${opts.projectUrl}`,
  ].join("\n");

  const bodyHtml = `
    <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.72)">
      <strong style="color:#fff">${escapeHtml(opts.inviterName)}</strong>
      added you to
      <strong style="color:#fff">${escapeHtml(opts.projectName)}</strong>.
      You're ready to jump in.
    </p>
    ${detailRows([
      { label: "Project", value: opts.projectName },
      { label: "Access", value: access },
      { label: "Added by", value: opts.inviterName },
    ])}
    <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:rgba(255,255,255,0.48)">
      ${escapeHtml(roleHint(opts.role))}
    </p>
  `;

  const html = renderEmailShell({
    preheader: `You're on ${opts.projectName} · ${access}`,
    eyebrow: "You're in",
    title: "Welcome to the project",
    bodyHtml,
    ctaLabel: "Open project",
    ctaUrl: opts.projectUrl,
    footerNote:
      "You already have an account, so no invite acceptance is needed — just open the project.",
  });

  return { subject, text, html };
}

function featureGrid(
  items: Array<{ title: string; body: string; accent: string }>,
) {
  const rows: string[] = [];
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i]!;
    const right = items[i + 1];
    rows.push(`
      <tr>
        <td width="50%" valign="top" style="padding:0 6px 12px 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px">
            <tr>
              <td style="padding:16px 14px">
                <div style="width:28px;height:3px;border-radius:999px;background:${left.accent};margin:0 0 12px"></div>
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">${escapeHtml(left.title)}</p>
                <p style="margin:0;font-size:12px;line-height:1.55;color:rgba(255,255,255,0.50)">${escapeHtml(left.body)}</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" valign="top" style="padding:0 0 12px 6px">
          ${
            right
              ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px">
            <tr>
              <td style="padding:16px 14px">
                <div style="width:28px;height:3px;border-radius:999px;background:${right.accent};margin:0 0 12px"></div>
                <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">${escapeHtml(right.title)}</p>
                <p style="margin:0;font-size:12px;line-height:1.55;color:rgba(255,255,255,0.50)">${escapeHtml(right.body)}</p>
              </td>
            </tr>
          </table>`
              : "&nbsp;"
          }
        </td>
      </tr>`);
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 4px">
      ${rows.join("")}
    </table>`;
}

/**
 * Advanced "Meet Nova" welcome email — onboarding / first-touch for NovaStudio.
 * Personalize with firstName when available (Clerk / waitlist).
 */
export function meetNovaWelcomeEmail(opts: {
  firstName?: string | null;
  /** Defaults to APP_ORIGIN + /projects */
  ctaUrl?: string;
  /** Optional secondary link (quick tour / docs) */
  tourUrl?: string;
}) {
  const origin = appOrigin() || "https://novastudio.app";
  const ctaUrl = opts.ctaUrl?.trim() || `${origin}/projects`;
  const tourUrl = opts.tourUrl?.trim() || `${origin}/docs`;
  const firstName = opts.firstName?.trim() || "";
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,";

  const subject = "Meet Nova — your cloud workspace for teams that ship";
  const text = [
    "Meet Nova",
    "The cloud workspace for teams that think and ship out loud.",
    "",
    greeting,
    "",
    "We built NovaStudio because great software rarely arrives fully formed — it gets shaped in conversation, iteration, and shared context. Nova is a real-time, cloud-native editor designed to help you and your team capture ideas, write code, and refine work from spark to ship.",
    "",
    "What you can do with Nova:",
    "• Spin up projects instantly — blank canvas or starter templates",
    "• Collaborate live with presence, comments, and shared editing",
    "• Run a full workspace in the browser — terminal, preview, and AI side-by-side",
    "• Invite your team with org workspaces and per-project roles",
    "",
    `Your workspace is ready: ${ctaUrl}`,
    "",
    `Need a hand? Quick tour: ${tourUrl}`,
    "Or reply to this email — a real human on our team will get back to you.",
    "",
    "Happy building,",
    "The Nova team",
  ].join("\n");

  const year = new Date().getFullYear();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <title>Meet Nova</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#06070d;-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
    The cloud workspace for teams that think and ship out loud.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#06070d;padding:28px 14px 40px">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;border-collapse:separate">

          <!-- Wordmark -->
          <tr>
            <td style="padding:4px 0 18px;text-align:center;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
              <span style="font-size:12px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#a78bfa">NovaStudio</span>
            </td>
          </tr>

          <!-- Hero card -->
          <tr>
            <td style="border-radius:22px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);background:radial-gradient(120% 80% at 10% -10%,rgba(139,92,246,0.35),transparent 55%),radial-gradient(90% 70% at 100% 0%,rgba(34,211,238,0.18),transparent 45%),linear-gradient(165deg,#141522 0%,#0a0b14 60%,#08090f 100%);box-shadow:0 28px 90px rgba(0,0,0,0.55)">
              <div style="height:3px;background:linear-gradient(90deg,#8b5cf6,#3b82f6,#22d3ee)"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:40px 32px 12px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#22d3ee">
                      Meet Nova ✦
                    </p>
                    <h1 style="margin:0 0 14px;font-size:30px;line-height:1.2;font-weight:750;letter-spacing:-0.03em;color:#ffffff">
                      The cloud workspace for teams that think out loud.
                    </h1>
                    <p style="margin:0;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.62)">
                      Real-time editing, live preview, AI, and team orgs — from first spark to shipped product.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 32px 8px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
                    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.85)">
                      ${escapeHtml(greeting)}
                    </p>
                    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.62)">
                      We built NovaStudio because great software rarely arrives fully formed — it gets shaped in conversation, iteration, and shared context. Nova is a real-time, cloud-native editor designed to help you and your team capture ideas, write code, and refine work from spark to ship.
                    </p>
                    <p style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.42)">
                      What you can do with Nova
                    </p>
                    ${featureGrid([
                      {
                        title: "Instant projects",
                        body: "Start blank or from templates — Next.js, React, Vite, and more — ready in the browser.",
                        accent: "linear-gradient(90deg,#8b5cf6,#a78bfa)",
                      },
                      {
                        title: "Live collaboration",
                        body: "Edit together with presence, inline comments, and shared context across the workspace.",
                        accent: "linear-gradient(90deg,#3b82f6,#60a5fa)",
                      },
                      {
                        title: "Full cloud IDE",
                        body: "Terminal, preview, AI assistant, and GitHub sync — no local setup required.",
                        accent: "linear-gradient(90deg,#22d3ee,#67e8f9)",
                      },
                      {
                        title: "Team workspaces",
                        body: "Organizations, invites, and per-project roles so every collaborator has the right access.",
                        accent: "linear-gradient(90deg,#c084fc,#f0abfc)",
                      },
                    ])}
                    <p style="margin:8px 0 0;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.62)">
                      Your workspace is ready. Jump in with a blank canvas or one of our starter templates.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:24px 32px 36px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="border-radius:14px;background:linear-gradient(135deg,#8b5cf6,#6d28d9)">
                          <a href="${escapeAttr(ctaUrl)}"
                             style="display:inline-block;padding:15px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.01em">
                            Open Nova
                          </a>
                        </td>
                        <td width="12"></td>
                        <td style="border-radius:14px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04)">
                          <a href="${escapeAttr(tourUrl)}"
                             style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.82);text-decoration:none">
                            Quick tour
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.45)">
                      Need a hand getting started? Check out our quick tour or reply to this email — a real human on our team will get back to you.
                    </p>
                    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.72)">
                      Happy building,<br/>
                      <strong style="color:#fff">The Nova team</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 10px 0;text-align:center;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
              <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.34)">
                You're receiving this because you joined NovaStudio.
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.26)">
                © ${year} NovaStudio · Cloud workspace for builders
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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
