/**
 * Synthesized notification sound pack (Web Audio).
 * No binary assets required — pleasant, distinct tones per event.
 */

export type NotificationSoundKind =
  | "notify"
  | "success"
  | "warning"
  | "error"
  | "message"
  | "aiDone";

type Tone = {
  frequency: number;
  start: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
};

const PACK: Record<NotificationSoundKind, Tone[]> = {
  notify: [
    { frequency: 880, start: 0, duration: 0.12, gain: 0.08 },
    { frequency: 1174.66, start: 0.1, duration: 0.16, gain: 0.07 },
  ],
  success: [
    { frequency: 523.25, start: 0, duration: 0.12, gain: 0.07 },
    { frequency: 659.25, start: 0.1, duration: 0.14, gain: 0.07 },
    { frequency: 783.99, start: 0.2, duration: 0.2, gain: 0.08 },
  ],
  warning: [
    { frequency: 440, start: 0, duration: 0.16, gain: 0.08, type: "triangle" },
    { frequency: 370, start: 0.18, duration: 0.2, gain: 0.07, type: "triangle" },
  ],
  error: [
    { frequency: 220, start: 0, duration: 0.22, gain: 0.09, type: "square" },
    { frequency: 180, start: 0.2, duration: 0.28, gain: 0.07, type: "square" },
  ],
  message: [
    { frequency: 740, start: 0, duration: 0.1, gain: 0.06 },
    { frequency: 990, start: 0.08, duration: 0.14, gain: 0.06 },
  ],
  // Soft major arpeggio — warm “AI finished” chime
  aiDone: [
    { frequency: 523.25, start: 0, duration: 0.35, gain: 0.055, type: "sine" },
    { frequency: 659.25, start: 0.12, duration: 0.4, gain: 0.05, type: "sine" },
    { frequency: 783.99, start: 0.24, duration: 0.5, gain: 0.045, type: "sine" },
    { frequency: 1046.5, start: 0.4, duration: 0.65, gain: 0.04, type: "sine" },
  ],
};

let sharedCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedCtx) sharedCtx = new Ctx();
  return sharedCtx;
}

function playTone(ctx: AudioContext, tone: Tone, when: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tone.type ?? "sine";
  osc.frequency.value = tone.frequency;
  const start = when + tone.start;
  const end = start + tone.duration;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end + 0.02);
}

export async function playNotificationSound(
  kind: NotificationSoundKind,
  volume = 1,
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  const when = ctx.currentTime + 0.01;
  const tones = PACK[kind];
  for (const tone of tones) {
    playTone(ctx, { ...tone, gain: tone.gain * Math.max(0, Math.min(1, volume)) }, when);
  }
}

export function listNotificationSounds(): NotificationSoundKind[] {
  return Object.keys(PACK) as NotificationSoundKind[];
}
