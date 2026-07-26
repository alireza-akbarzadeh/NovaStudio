import type { Metadata } from "next";

import { BlogView } from "@/features/auth/components/blog/blog-view";

export const metadata: Metadata = {
  title: "Blog · NovaStudio",
  description:
    "Engineering deep dives, product updates, tutorials, and company news from the NovaStudio team.",
};

export default function BlogPage() {
  return <BlogView />;
}
