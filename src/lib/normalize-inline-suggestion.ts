/**
 * Strip BOM, markdown fences, and common wrappers from LLM code output.
 * Does not reject chatty preambles or cap length (callers decide).
 */
export function stripLlmCodeWrapper(raw: string): string {
  let text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return "";

  // Prefer explicit <suggestion> body when the model wraps output.
  const tagged = text.match(/<suggestion>\s*([\s\S]*?)\s*<\/suggestion>/i);
  if (tagged?.[1] != null) {
    text = tagged[1].trim();
  }

  // Unwrap a single surrounding markdown fence.
  const fenced = text.match(/^```(?:[\w+-]*)?[ \t]*\r?\n?([\s\S]*?)\r?\n?```$/);
  if (fenced?.[1] != null) {
    text = fenced[1].trim();
  }

  // Models sometimes emit fragmented fences mid-string — strip markers.
  return text
    .replace(/```[\w+-]*[ \t]*/g, "")
    .replace(/```/g, "")
    .replace(/<\/?suggestion>/gi, "")
    .trim();
}

/**
 * Turn messy LLM completion output into plain text suitable for Monaco
 * inline ghost-text (no fences, no XML wrappers, no commentary).
 */
export function normalizeInlineSuggestion(raw: string): string | null {
  let text = stripLlmCodeWrapper(raw);
  if (!text) return null;

  // Drop obvious chatty preambles.
  if (
    /^(here'?s|sure[,!]?\s|i (?:would )?suggest|the (?:suggested )?code|completion:)/i.test(
      text,
    )
  ) {
    return null;
  }

  // Cap runaway completions (inline suggest should stay short).
  if (text.length > 800) {
    text = text.slice(0, 800);
  }

  return text;
}

/**
 * Normalize a full selection rewrite for inline AI edit (no length cap).
 */
export function normalizeQuickEdit(raw: string): string | null {
  const text = stripLlmCodeWrapper(raw);
  return text || null;
}
