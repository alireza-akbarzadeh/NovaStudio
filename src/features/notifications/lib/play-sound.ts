import {
  playNotificationSound,
  type NotificationSoundKind,
} from "@/features/notifications/lib/sound-pack";

const PREFS_KEY = "polaris.notificationSounds";

export type SoundPrefs = {
  enabled: boolean;
  volume: number;
};

export function getSoundPrefs(): SoundPrefs {
  if (typeof window === "undefined") {
    return { enabled: true, volume: 0.85 };
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return { enabled: true, volume: 0.85 };
    const parsed = JSON.parse(raw) as Partial<SoundPrefs>;
    return {
      enabled: parsed.enabled !== false,
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(1, parsed.volume))
          : 0.85,
    };
  } catch {
    return { enabled: true, volume: 0.85 };
  }
}

export function setSoundPrefs(prefs: Partial<SoundPrefs>) {
  const next = { ...getSoundPrefs(), ...prefs };
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

export async function playSoundIfEnabled(kind: NotificationSoundKind) {
  const prefs = getSoundPrefs();
  if (!prefs.enabled) return;
  await playNotificationSound(kind, prefs.volume);
}
