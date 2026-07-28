import { toast } from "sonner";

import { copyInviteLink } from "@/features/sharing/lib/invite-link";

type InviteResult =
  | {
      kind: "added";
      emailSent: boolean;
      emailError?: string;
    }
  | {
      kind: "invited";
      token: string;
      inviteUrl?: string;
      emailSent: boolean;
      emailError?: string;
    };

/** Toast + optional clipboard fallback after `sharing.inviteByEmail`. */
export async function reportInviteResult(result: InviteResult) {
  if (result.kind === "added") {
    if (result.emailSent) {
      toast.success("Member added — notification email sent");
      return;
    }

    toast.success("Member added");
    if (result.emailError) {
      toast.error("Email not sent", { description: result.emailError });
    }
    return;
  }

  if (result.emailSent) {
    toast.success("Invite email sent");
    return;
  }

  // Invite record exists, but Resend did not deliver — never claim email was sent.
  let linkCopied = false;
  try {
    await copyInviteLink(result.token);
    linkCopied = true;
  } catch {
    linkCopied = false;
  }

  toast.warning(
    linkCopied
      ? "Invite created — link copied (email not sent)"
      : "Invite created — email not sent",
    {
      description:
        result.emailError ??
        "Share the invite link manually, or verify a Resend domain to email others.",
    },
  );
}
