const UNITS = ["B", "KB", "MB", "GB"] as const;

/** Human-readable byte size (1024-based). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  const digits = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${UNITS[unitIndex]}`;
}
