import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import type { Id } from "@/convex/_generated/dataModel";

export type WorkspaceChatPanelProps = {
  projectId: string;
};

export type ChatSubmitMessage = PromptInputMessage & {
  mentionedPaths?: string[];
};

export type MentionFileOption = {
  path: string;
  name: string;
  value: string;
};

export type ChatAttachment = {
  storageId: Id<"_storage">;
  filename: string;
  mediaType: string;
  kind: "file" | "voice";
  url: string | null;
};

export const MAX_CHAT_FILES = 8;
export const MAX_CHAT_FILE_SIZE = 12 * 1024 * 1024;
