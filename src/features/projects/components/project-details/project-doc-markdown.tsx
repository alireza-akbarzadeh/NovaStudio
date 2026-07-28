"use client";

import { cjk } from "@streamdown/cjk";
import { createCodePlugin } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { useTheme } from "next-themes";
import { memo, useMemo } from "react";
import {
  CodeBlock,
  CodeBlockCopyButton,
  CodeBlockDownloadButton,
  Streamdown,
  type CustomRendererProps,
} from "streamdown";

import { cn } from "@/lib/utils";

import "./project-doc-markdown.css";

const CODE_LANGUAGES = [
  "",
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
  "css",
  "html",
  "markdown",
  "md",
  "bash",
  "shell",
  "sh",
  "zsh",
  "python",
  "rust",
  "go",
  "yaml",
  "yml",
  "text",
  "plaintext",
  "vue",
] as const;

const SHELL_LANGUAGES = new Set(["bash", "shell", "sh", "zsh"]);

function DocCodeBlock({ code, language, isIncomplete }: CustomRendererProps) {
  const lang = (language ?? "").toLowerCase();
  const isShell = SHELL_LANGUAGES.has(lang);

  return (
    <div
      className={cn(
        "project-doc-code-wrap",
        isShell && "project-doc-code-wrap--shell",
        !isShell && lang && `project-doc-code-wrap--${lang}`,
      )}
    >
      <CodeBlock code={code} language={language} isIncomplete={isIncomplete}>
        <CodeBlockCopyButton />
        <CodeBlockDownloadButton />
      </CodeBlock>
    </div>
  );
}

type ProjectDocMarkdownProps = {
  content: string;
  className?: string;
};

export const ProjectDocMarkdown = memo(function ProjectDocMarkdown({
  content,
  className,
}: ProjectDocMarkdownProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const shikiTheme = useMemo(
    (): [string, string] =>
      isDark ? ["github-dark", "github-dark"] : ["github-light", "github-light"],
    [isDark],
  );

  const plugins = useMemo(
    () => ({
      cjk,
      code: createCodePlugin({ themes: shikiTheme }),
      math,
      mermaid,
      renderers: [
        {
          language: [...CODE_LANGUAGES],
          component: DocCodeBlock,
        },
      ],
    }),
    [shikiTheme],
  );

  if (!content.trim()) {
    return (
      <p className="text-sm text-muted-foreground">
        This document is empty.
      </p>
    );
  }

  return (
    <Streamdown
      plugins={plugins}
      shikiTheme={shikiTheme}
      className={cn(
        "project-doc-markdown",
        isDark ? "project-doc-markdown--dark" : "project-doc-markdown--light",
        className,
      )}
    >
      {content}
    </Streamdown>
  );
});
