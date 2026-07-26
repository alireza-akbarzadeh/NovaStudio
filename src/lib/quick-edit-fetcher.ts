import ky from "ky";
import { toast } from "sonner";
import { z } from "zod";

import { truncateForContext } from "@/lib/ai/workspace-context";
import { normalizeQuickEdit } from "@/lib/normalize-inline-suggestion";

const MAX_SELECTED_CHARS = 24_000;
const MAX_FULL_CODE_CHARS = 16_000;

const quickEditRequestSchema = z.object({
  selectedCode: z.string().min(1).max(MAX_SELECTED_CHARS),
  fullCode: z.string(),
  instruction: z.string().min(1).max(2_000),
  fileName: z.string().optional(),
  documentation: z.string().optional(),
});

const quickEditResponseSchema = z.object({
  editedCode: z.string(),
});

export type QuickEditRequest = z.infer<typeof quickEditRequestSchema>;

export async function fetchQuickEdit(
  payload: QuickEditRequest,
  signal: AbortSignal,
): Promise<string | null> {
  try {
    const validated = quickEditRequestSchema.parse({
      ...payload,
      fullCode:
        truncateForContext(payload.fullCode, MAX_FULL_CODE_CHARS) ??
        payload.fullCode,
    });

    const response = await ky
      .post("/api/quick-edit", {
        json: validated,
        signal,
        timeout: 45_000,
        retry: 0,
      })
      .json();

    const { editedCode } = quickEditResponseSchema.parse(response);
    return normalizeQuickEdit(editedCode) ?? editedCode;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }
    toast.error("Inline AI edit failed");
    return null;
  }
}
