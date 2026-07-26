import type { Metadata } from "next";

import { WaitlistView } from "@/features/auth/components/waitlist/waitlist-view";

export const metadata: Metadata = {
  title: "Waitlist · NovaStudio",
  description:
    "Join the NovaStudio waitlist for early access, product drops, and private previews.",
};

export default function WaitlistPage() {
  return <WaitlistView />;
}
