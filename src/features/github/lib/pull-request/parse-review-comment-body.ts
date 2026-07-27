export type ParsedReviewCommentBody = {
  text: string;
  suggestion?: string;
};

const SUGGESTION_BLOCK = /```suggestion\n([\s\S]*?)\n```/;

/** Split GitHub review comment text from optional ```suggestion blocks. */
export function parseReviewCommentBody(body: string): ParsedReviewCommentBody {
  const match = body.match(SUGGESTION_BLOCK);
  if (!match) {
    return { text: body.trim() };
  }

  const text = body.replace(SUGGESTION_BLOCK, "").trim();
  return {
    text,
    suggestion: match[1]?.trim(),
  };
}
