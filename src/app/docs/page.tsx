import type { Metadata } from "next";

import { DocsView } from "@/features/auth/components/docs/docs-view";

export const metadata: Metadata = {
  title: "Documentation · NovaStudio",
  description:
    "Guides for NovaStudio workspaces, live collaboration, Nova AI, and one-click deployment.",
};

export default function DocsPage() {
  return <DocsView />;
}
