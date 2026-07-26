"use client";

import { DownloadIcon, PaperclipIcon } from "lucide-react";

import { ChatAudioPlayer } from "@/features/workspace/components/workspace-chat/chat-audio-player";
import type { ChatAttachment } from "@/features/workspace/components/workspace-chat/types";
import { cn } from "@/lib/utils";

export type ChatMessageAttachmentsProps = {
  attachments: ChatAttachment[];
};

export function ChatMessageAttachments({
  attachments,
}: ChatMessageAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {attachments.map((attachment) => {
        const isAudio =
          attachment.kind === "voice" ||
          attachment.mediaType.startsWith("audio/");
        const isImage = attachment.mediaType.startsWith("image/");

        if (isAudio && attachment.url) {
          return (
            <ChatAudioPlayer
              key={attachment.storageId}
              src={attachment.url}
              label={
                attachment.kind === "voice" ? "Voice message" : attachment.filename
              }
            />
          );
        }

        if (isImage && attachment.url) {
          return (
            <a
              key={attachment.storageId}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="block max-w-60 overflow-hidden rounded-md border border-ws-border-subtle"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.url}
                alt={attachment.filename}
                className="max-h-48 w-full object-cover"
              />
            </a>
          );
        }

        return (
          <a
            key={attachment.storageId}
            href={attachment.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            download={attachment.filename}
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-md border border-ws-border-subtle bg-ws-hover/50 px-2 py-1.5 text-[11px] text-ws-text hover:border-ws-accent/40 hover:text-ws-accent",
              !attachment.url && "pointer-events-none opacity-50",
            )}
          >
            <PaperclipIcon className="size-3 shrink-0" />
            <span className="truncate">{attachment.filename}</span>
            <DownloadIcon className="size-3 shrink-0 opacity-60" />
          </a>
        );
      })}
    </div>
  );
}
