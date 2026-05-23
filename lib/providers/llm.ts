import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { z } from "zod/v4";

/* ── Provider selection ───────────────────────────────────────────────────
   Three modes, controlled by LLM_PROVIDER:
     "gateway" (default) → AI Gateway: model string "provider/model"
     "groq"             → Groq API (OpenAI-compatible)
     "openai"           → Direct OpenAI
   ──────────────────────────────────────────────────────────────────────────── */
const PROVIDER = (process.env.LLM_PROVIDER ?? "gateway").toLowerCase();
const MODEL = process.env.LLM_MODEL ?? "openai/gpt-4o-mini";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function getModel() {
  switch (PROVIDER) {
    case "groq": {
      const groq = createOpenAI({
        name: "groq",
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
      });
      return groq(GROQ_MODEL);
    }
    case "openai": {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai(OPENAI_MODEL);
    }
    default: {
      /* AI Gateway — model string "provider/model" */
      return MODEL;
    }
  }
}

const model = getModel();

/**
 * Whether a real LLM is available (key present for the active provider).
 * When false, agents fall back to deterministic heuristics so the whole
 * pipeline runs keyless — same philosophy as the simulated video provider.
 */
export function hasLLM(): boolean {
  if (PROVIDER === "groq") return Boolean(process.env.GROQ_API_KEY);
  if (PROVIDER === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

export async function genObject<T>(
  schema: z.ZodType<T>,
  prompt: string,
  system?: string,
): Promise<T> {
  const { object } = await generateObject({ model, schema, prompt, system });
  return object as T;
}

export async function genText(prompt: string, system?: string): Promise<string> {
  const { text } = await generateText({ model, prompt, system });
  return text.trim();
}
