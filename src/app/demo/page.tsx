import type { Metadata } from "next";

import { DemoView } from "@/features/auth/components/demo/demo-view";

export const metadata: Metadata = {
  title: "Product Tour · NovaStudio",
  description:
    "A guided walkthrough of NovaStudio — cloud workspaces, live collaboration, Ask NovaStudio, and shipping from the browser.",
};

export default function DemoPage() {
  return <DemoView />;
}
