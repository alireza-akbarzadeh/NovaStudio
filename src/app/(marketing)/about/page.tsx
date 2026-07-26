import type { Metadata } from "next";

import { AboutView } from "@/features/auth/components/about/about-view";

export const metadata: Metadata = {
  title: "About · NovaStudio",
  description:
    "Meet the NovaStudio team and learn how we're building the collaborative cloud workspace for shipping software together.",
};

export default function AboutPage() {
  return <AboutView />;
}
