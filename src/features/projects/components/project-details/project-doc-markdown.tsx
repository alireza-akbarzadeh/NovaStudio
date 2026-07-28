"use client";

import { cjk } from "@streamdown/cjk";
import { createCodePlugin } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { memo } from "react";
import { Streamdown } from "streamdown";

import { cn } from "@/lib/utils";

const docCodePlugin = createCodePlugin({
  themes: ["github-light", "github-dark"],
});

const docPlugins = { cjk, code: docCodePlugin, math, mermaid };

type ProjectDocMarkdownProps = {
  content: string;
  className?: string;
};

export const ProjectDocMarkdown = memo(function ProjectDocMarkdown({
  content,
  className,
}: ProjectDocMarkdownProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        This document is empty.
      </p>
    );
  }

  return (
    <Streamdown
      plugins={docPlugins}
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:scroll-mt-20 prose-headings:font-semibold",
        "prose-a:text-primary prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:rounded-xl prose-pre:border prose-pre:border-border/60",
        className,
      )}
    >
      {content}
    </Streamdown>
  );
});
