import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  formatChunksForPrompt,
  type SemanticSearchChunk,
} from "@/features/workspace/lib/semantic-search-index";
import { POLARIS_COMPLETION_MODEL } from "@/lib/ai/gemini-model";
import { SEMANTIC_SEARCH_PROMPT } from "@/lib/prompt";

const chunkSchema = z.object({
  id: z.string(),
  path: z.string(),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  headline: z.string(),
  excerpt: z.string(),
  symbols: z.array(z.string()),
});

const semanticSearchRequestSchema = z.object({
  query: z.string().min(3).max(500),
  projectName: z.string().optional(),
  chunks: z.array(chunkSchema).min(1).max(40),
});

const resultSchema = z.object({
  path: z.string().min(1),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  snippet: z.string().min(1),
  summary: z.string().min(1),
});

const semanticSearchResponseSchema = z.object({
  results: z.array(resultSchema).max(12),
});

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

function buildPrompt(
  query: string,
  projectName: string | undefined,
  chunks: SemanticSearchChunk[],
) {
  return SEMANTIC_SEARCH_PROMPT.replace(
    "{projectName}",
    projectName?.trim() || "(unnamed)",
  )
    .replace("{query}", query.trim())
    .replace("{chunks}", formatChunksForPrompt(chunks));
}

export async function POST(request: Request) {
  try {
    const body = semanticSearchRequestSchema.parse(await request.json());
    const allowedPaths = new Set(body.chunks.map((chunk) => chunk.path));

    const { text } = await generateText({
      model: google(POLARIS_COMPLETION_MODEL),
      prompt: buildPrompt(body.query, body.projectName, body.chunks),
    });

    const parsedJson = JSON.parse(stripJsonNoise(text)) as unknown;
    const parsed = semanticSearchResponseSchema.parse(parsedJson);

    const results = parsed.results.filter((row) => allowedPaths.has(row.path));

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Semantic search request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
