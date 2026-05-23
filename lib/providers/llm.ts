import { generateObject, generateText } from "ai";
import type { z } from "zod";

const MODEL = process.env.LLM_MODEL ?? "openai/gpt-4o-mini";

/**
 * Whether a real LLM is available (Vercel AI Gateway key). When false, the
 * agents fall back to deterministic heuristics so the whole pipeline runs
 * keyless — same philosophy as the simulated video provider.
 */
export function hasLLM(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

export async function genObject<T>(
  schema: z.ZodType<T>,
  prompt: string,
  system?: string,
): Promise<T> {
  const { object } = await generateObject({ model: MODEL, schema, prompt, system });
  return object as T;
}

export async function genText(prompt: string, system?: string): Promise<string> {
  const { text } = await generateText({ model: MODEL, prompt, system });
  return text.trim();
}
