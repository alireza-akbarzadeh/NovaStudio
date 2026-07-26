import type { Metadata } from "next";

import { BlogPostView } from "@/features/auth/components/blog/blog-post-view";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ")} · Blog · NovaStudio`,
    description: "NovaStudio blog article.",
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  return <BlogPostView slug={slug} />;
}
