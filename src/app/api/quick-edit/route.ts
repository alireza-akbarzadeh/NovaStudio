import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { POLARIS_COMPLETION_MODEL } from "@/lib/ai/gemini-model";
import { truncateForContext } from "@/lib/ai/workspace-context";
import { normalizeQuickEdit } from "@/lib/normalize-inline-suggestion";
import { QUICK_EDIT_PROMPT } from "@/lib/prompt";

const MAX_SELECTED_CHARS = 24_000;
const MAX_FULL_CODE_CHARS = 16_000;
const MAX_INSTRUCTION_CHARS = 2_000;

const quickEditRequestSchema = z.object({
  selectedCode: z.string().min(1).max(MAX_SELECTED_CHARS),
  fullCode: z.string().max(MAX_FULL_CODE_CHARS + 80),
  instruction: z.string().min(1).max(MAX_INSTRUCTION_CHARS),
  fileName: z.string().optional(),
  documentation: z.string().max(4_000).optional(),
});

function buildPrompt(input: z.infer<typeof quickEditRequestSchema>) {
  const docs = input.documentation?.trim()
    ? `<documentation>\n${input.documentation.trim()}\n</documentation>`
    : "";

  return QUICK_EDIT_PROMPT.replace("{selectedCode}", input.selectedCode)
    .replace(
      "{fullCode}",
      truncateForContext(input.fullCode, MAX_FULL_CODE_CHARS) ?? "",
    )
    .replace("{instruction}", input.instruction.trim())
    .replace("{documentation}", docs);
}

export async function POST(request: Request) {
  try {
    const body = quickEditRequestSchema.parse(await request.json());
    const { text } = await generateText({
      model: google(POLARIS_COMPLETION_MODEL),
      prompt: buildPrompt(body),
    });

    const editedCode = normalizeQuickEdit(text) ?? body.selectedCode;
    return NextResponse.json({ editedCode });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate edit" },
      { status: 500 },
    );
  }
}
