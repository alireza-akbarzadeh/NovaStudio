import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { POLARIS_COMPLETION_MODEL } from "@/lib/ai/gemini-model";
import { CODE_REVIEW_PROMPT } from "@/lib/prompt";

const reviewFileSchema = z.object({
  path: z.string(),
  isNew: z.boolean(),
  content: z.string(),
  syncedContent: z.string(),
});

const codeReviewRequestSchema = z.object({
  projectName: z.string().optional(),
  files: z.array(reviewFileSchema).min(1).max(20),
});

const findingSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  severity: z.enum(["error", "warning", "info"]),
  title: z.string().min(1),
  message: z.string().min(1),
  startLine: z.number().int().positive().optional(),
  endLine: z.number().int().positive().optional(),
  suggestedContent: z.string().optional(),
});

const codeReviewResponseSchema = z.object({
  findings: z.array(findingSchema).max(12),
});

function formatChanges(files: z.infer<typeof reviewFileSchema>[]): string {
  return files
    .map((file) => {
      const status = file.isNew ? "new file" : "modified";
      const parts = [
        `### ${file.path} (${status})`,
        file.isNew
          ? null
          : file.syncedContent
            ? `<before>\n${file.syncedContent}\n</before>`
            : null,
        file.content
          ? `<after>\n${file.content}\n</after>`
          : "<after>(empty)</after>",
      ];
      return parts.filter(Boolean).join("\n");
    })
    .join("\n\n");
}

function buildPrompt(input: z.infer<typeof codeReviewRequestSchema>) {
  return CODE_REVIEW_PROMPT.replace(
    "{projectName}",
    input.projectName?.trim() || "(unnamed)",
  ).replace("{stagedChanges}", formatChanges(input.files));
}

function stripJsonNoise(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    const body = codeReviewRequestSchema.parse(await request.json());
    const allowedPaths = new Set(body.files.map((file) => file.path));

    const { text } = await generateText({
      model: google(POLARIS_COMPLETION_MODEL),
      prompt: buildPrompt(body),
    });

    const parsedJson = JSON.parse(stripJsonNoise(text)) as unknown;
    const parsed = codeReviewResponseSchema.parse(parsedJson);

    const findings = parsed.findings
      .filter((finding) => allowedPaths.has(finding.path))
      .map((finding, index) => ({
        ...finding,
        id: finding.id || `finding-${index + 1}`,
        suggestedContent: finding.suggestedContent?.trim()
          ? finding.suggestedContent
          : undefined,
      }));

    return NextResponse.json({ findings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Code review request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
