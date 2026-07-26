import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Product Tour · NovaStudio",
  description:
    "A guided walkthrough of NovaStudio — cloud workspaces, live collaboration, team chat, Ask NovaStudio, debug, and shipping from the browser.",
};

export default function DemoPage() {
  redirect("/#demo");
}
