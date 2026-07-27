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
    } else {
      toast.success("Member added");
      if (result.emailError) {
        toast.message("Email not sent", { description: result.emailError });
      }
    }
    return;
  }

  if (result.emailSent) {
    toast.success("Invite email sent");
    return;
  }

  try {
    await copyInviteLink(result.token);
    toast.success("Invite created — link copied (email not configured)");
    if (result.emailError) {
      toast.message("Email not sent", { description: result.emailError });
    }
  } catch {
    toast.success("Invite created — copy the link from pending invites");
    if (result.emailError) {
      toast.message("Email not sent", { description: result.emailError });
    }
  }
}
