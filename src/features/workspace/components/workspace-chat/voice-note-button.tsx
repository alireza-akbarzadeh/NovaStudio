"use client";

import { MicIcon, SquareIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  PromptInputButton,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { cn } from "@/lib/utils";

export type VoiceNoteButtonProps = {
  disabled?: boolean;
};

export function VoiceNoteButton({ disabled }: VoiceNoteButtonProps) {
  const attachments = usePromptInputAttachments();
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(
    () => () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      for (const track of streamRef.current?.getTracks() ?? []) {
        track.stop();
      }
    },
    [],
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("MediaRecorder" in window) ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      toast.error("Voice recording is not supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : undefined;
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;

        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        if (blob.size === 0) {
          toast.error("No audio captured");
          return;
        }

        const extension = type.includes("ogg")
          ? "ogg"
          : type.includes("mp4")
            ? "m4a"
            : "webm";
        const file = new File(
          [blob],
          `voice-note-${Date.now()}.${extension}`,
          { type },
        );
        attachments.add([file]);
      });

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setRecording(false);
      toast.error("Microphone permission denied");
    }
  }, [attachments]);

  return (
    <PromptInputButton
      type="button"
      className={cn(
        "size-7",
        recording
          ? "bg-destructive/15 text-destructive hover:bg-destructive/25 hover:text-destructive"
          : "text-ws-text-muted hover:bg-ws-hover hover:text-ws-text",
      )}
      tooltip={recording ? "Stop recording" : "Record voice note"}
      disabled={disabled}
      onClick={() => {
        if (recording) {
          stopRecording();
        } else {
          void startRecording();
        }
      }}
    >
      {recording ? (
        <SquareIcon className="size-3.5" />
      ) : (
        <MicIcon className="size-3.5" />
      )}
    </PromptInputButton>
  );
}
