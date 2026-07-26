/** Platform-aware modifier key helpers (⌘ on Apple, Ctrl on Windows/Linux). */

export function isApplePlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent ?? "";
  const platform = navigator.platform ?? "";
  return /Mac|iPhone|iPad|iPod/i.test(platform) || /Mac OS|iPhone|iPad/i.test(ua);
}

/** Primary modifier symbol for tooltips and shortcut labels. */
export function modKeyLabel(isApple = isApplePlatform()): string {
  return isApple ? "⌘" : "Ctrl";
}

/**
 * Format a chord like `mod+shift+k` for display.
 * Apple: `⌘⇧K` · Windows/Linux: `Ctrl+Shift+K`
 */
export function formatModShortcut(
  chord: string,
  isApple = isApplePlatform(),
): string {
  const parts = chord
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);

  const tokens: string[] = [];

  for (const part of parts) {
    if (part === "mod") {
      tokens.push(isApple ? "⌘" : "Ctrl");
      continue;
    }
    if (part === "meta") {
      tokens.push("⌘");
      continue;
    }
    if (part === "ctrl" || part === "control") {
      tokens.push(isApple ? "⌃" : "Ctrl");
      continue;
    }
    if (part === "shift") {
      tokens.push(isApple ? "⇧" : "Shift");
      continue;
    }
    if (part === "alt" || part === "option") {
      tokens.push(isApple ? "⌥" : "Alt");
      continue;
    }
    if (part === "escape" || part === "esc") {
      tokens.push("Esc");
      continue;
    }
    tokens.push(part.length === 1 ? part.toUpperCase() : part);
  }

  return isApple ? tokens.join("") : tokens.join("+");
}
