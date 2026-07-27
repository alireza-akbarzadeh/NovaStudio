export function buildReviewCommentBody(comment: string, suggestion?: string) {
  const trimmed = comment.trim();
  const suggestionTrimmed = suggestion?.trim();
  if (!suggestionTrimmed) return trimmed;
  return `${trimmed}\n\n\`\`\`suggestion\n${suggestionTrimmed}\n\`\`\``;
}
