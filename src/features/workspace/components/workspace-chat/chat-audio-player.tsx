"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export type ChatAudioPlayerProps = {
  src: string;
  label?: string;
  className?: string;
};

export function ChatAudioPlayer({
  src,
  label = "Voice message",
  className,
}: ChatAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setFailed(true);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [src]);

  const toggle = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || failed) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setFailed(true);
      }
    } else {
      audio.pause();
    }
  }, [failed]);

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;

  if (failed) {
    return (
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-ws-border-subtle bg-ws-hover/50 px-3 py-2 text-[11px] text-ws-accent hover:border-ws-accent/40",
          className,
        )}
      >
        Open {label.toLowerCase()}
      </a>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full max-w-70 items-center gap-2 rounded-full border border-ws-border-subtle bg-ws-hover/50 px-2 py-1.5",
        className,
      )}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={playing ? "Pause" : "Play"}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ws-accent text-white hover:bg-ws-accent-hover"
      >
        {playing ? (
          <PauseIcon className="size-3.5 fill-current" />
        ) : (
          <PlayIcon className="size-3.5 fill-current" />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          aria-label="Seek"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-transparent [&::-webkit-slider-thumb]:size-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ws-accent [&::-moz-range-thumb]:size-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ws-accent"
          style={{
            background: `linear-gradient(to right, var(--ws-accent) ${progress * 100}%, color-mix(in oklab, var(--ws-text) 18%, transparent) ${progress * 100}%)`,
          }}
          onChange={(event) => {
            const next = Number(event.target.value);
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = next;
            setCurrentTime(next);
          }}
        />
        <div className="flex items-center justify-between text-[10px] tabular-nums text-ws-text-muted">
          <span>{formatTime(currentTime)}</span>
          <span className="truncate px-1">{label}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
