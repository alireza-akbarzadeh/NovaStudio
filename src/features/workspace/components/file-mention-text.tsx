"use client";

import type { ReactNode } from "react";

const MENTION_TOKEN = /@([^\s@]+)/g;

export function fileBasename(path: string) {
  return path.split("/").pop() || path;
}

export function resolveMentionPath(
  token: string,
  mentionedPaths: string[],
  projectFilePaths?: Set<string>,
): string | null {
  const cleaned = token.replace(/[.,;:!?)]+$/g, "");
  if (!cleaned) return null;

  if (mentionedPaths.includes(cleaned)) return cleaned;
  if (projectFilePaths?.has(cleaned)) return cleaned;

  const fromMentions = mentionedPaths.find(
    (path) => fileBasename(path) === cleaned,
  );
  if (fromMentions) return fromMentions;

  if (projectFilePaths) {
    for (const path of projectFilePaths) {
      if (fileBasename(path) === cleaned) return path;
    }
  }

  if (cleaned.includes("/") || cleaned.includes(".")) return cleaned;
  return null;
}

export function extractMentionedPaths(
  text: string,
  projectFilePaths: Set<string>,
): string[] {
  const mentionedPaths: string[] = [];
  const regex = new RegExp(MENTION_TOKEN.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const token = (match[1] ?? "").replace(/[.,;:!?)]+$/g, "");
    if (!token) continue;
    if (projectFilePaths.has(token)) {
      mentionedPaths.push(token);
      continue;
    }
    for (const path of projectFilePaths) {
      if (fileBasename(path) === token) {
        mentionedPaths.push(path);
        break;
      }
    }
  }
  return [...new Set(mentionedPaths)];
}

export function FileMentionText({
  body,
  mentionedPaths = [],
  projectFilePaths,
  onOpenFile,
  className,
}: {
  body: string;
  mentionedPaths?: string[];
  projectFilePaths?: Set<string>;
  onOpenFile: (path: string) => void;
  className?: string;
}) {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_TOKEN.source, "g");
  let match: RegExpExecArray | null;
  const paths = mentionedPaths ?? [];

  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index));
    }
    const rawToken = match[1] ?? "";
    const trailing = rawToken.match(/[.,;:!?)]+$/)?.[0] ?? "";
    const token = trailing ? rawToken.slice(0, -trailing.length) : rawToken;
    const path = resolveMentionPath(token, paths, projectFilePaths);
    if (path) {
      nodes.push(
        <a
          key={`${match.index}-${path}`}
          href={`#file/${encodeURIComponent(path)}`}
          className="cursor-pointer font-medium text-[#38bdf8] underline decoration-[#38bdf8]/60 underline-offset-2 hover:text-[#7dd3fc] hover:decoration-[#7dd3fc]"
          style={{ color: "#38bdf8" }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onOpenFile(path);
          }}
          title={`Open ${path}`}
        >
          @{fileBasename(path)}
        </a>,
      );
      if (trailing) nodes.push(trailing);
    } else {
      nodes.push(match[0]);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < body.length) {
    nodes.push(body.slice(lastIndex));
  }

  return (
    <div
      className={
        className ??
        "whitespace-pre-wrap wrap-break-word text-[12px] leading-relaxed text-ws-text"
      }
    >
      {nodes}
    </div>
  );
}
