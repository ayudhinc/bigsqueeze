import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod/v4";

/* ── Provider selection ───────────────────────────────────────────────────
   Four modes, controlled by LLM_PROVIDER:
     "gateway" (default) → AI Gateway: model string "provider/model"
     "groq"             → Groq API (OpenAI-compatible)
     "crusoe"           → Crusoe Cloud Managed Inference (OpenAI-compatible)
     "openai"           → Direct OpenAI
   ──────────────────────────────────────────────────────────────────────────── */
const PROVIDER = (process.env.LLM_PROVIDER ?? "gateway").toLowerCase();

export type AgentId =
  | "writer"
  | "director"
  | "dp"
  | "editor"
  | "sound"
  | "score"
  | "color";

/* ── Default model per provider ──────────────────────────────────────────── */
const DEFAULT_MODEL: string =
  PROVIDER === "groq"
    ? process.env.GROQ_MODEL ?? "openai/gpt-oss-20b"
    : PROVIDER === "crusoe"
      ? process.env.CRUSOE_MODEL ?? "hack-crusoe/Nemotron-3-Nano-30B-A3B-FP8"
      : PROVIDER === "openai"
        ? process.env.OPENAI_MODEL ?? "gpt-4o-mini"
        : process.env.LLM_MODEL ?? "openai/gpt-4o-mini";

/* ── Per-agent model routing ──────────────────────────────────────────────
   Override with env vars, e.g. LLM_MODEL_WRITER=llama-3.1-8b-instant.
   When unset, every agent uses the default model.
   ──────────────────────────────────────────────────────────────────────────── */
const AGENT_MODEL: Record<AgentId, string> = {
  writer:   process.env.LLM_MODEL_WRITER   ?? DEFAULT_MODEL,
  director: process.env.LLM_MODEL_DIRECTOR ?? DEFAULT_MODEL,
  dp:       process.env.LLM_MODEL_DP       ?? DEFAULT_MODEL,
  editor:   process.env.LLM_MODEL_EDITOR   ?? DEFAULT_MODEL,
  sound:    process.env.LLM_MODEL_SOUND    ?? DEFAULT_MODEL,
  score:    process.env.LLM_MODEL_SCORE    ?? DEFAULT_MODEL,
  color:    process.env.LLM_MODEL_COLOR    ?? DEFAULT_MODEL,
};

const ALL_SAME = new Set(Object.values(AGENT_MODEL)).size === 1;

/* ── Cached provider handles ────────────────────────────────────────────── */
let _groq: ReturnType<typeof createOpenAI> | null = null;
let _crusoe: ReturnType<typeof createOpenAI> | null = null;
let _openai: ReturnType<typeof createOpenAI> | null = null;

function resolveModel(agent?: AgentId) {
  const name = agent && !ALL_SAME ? AGENT_MODEL[agent] : DEFAULT_MODEL;

  switch (PROVIDER) {
    case "groq": {
      if (!_groq)
        _groq = createOpenAI({
          name: "groq",
          baseURL: "https://api.groq.com/openai/v1",
          apiKey: process.env.GROQ_API_KEY,
        });
      return _groq(name);
    }
    case "crusoe": {
      if (!_crusoe)
        _crusoe = createOpenAI({
          name: "crusoe",
          baseURL: process.env.CRUSOE_BASE_URL ?? "https://api.inference.crusoecloud.com/v1",
          apiKey: process.env.CRUSOE_API_KEY,
        });
      return _crusoe.chat(name);
    }
    case "openai": {
      if (!_openai)
        _openai = createOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      return _openai(name);
    }
    default:
      return name;
  }
}

/* ── JSON-schema support lookup ────────────────────────────────────────────
   Groq only supports json_schema on GPT-OSS and Llama 4 Scout.
   ──────────────────────────────────────────────────────────────────────────── */
const JSON_SCHEMA_MODELS = new Set([
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-safeguard-20b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
]);

function supportsJsonSchema(modelName: string): boolean {
  if (PROVIDER === "gateway") return true;
  if (PROVIDER === "openai") return true;
  return JSON_SCHEMA_MODELS.has(modelName);
}

/* ── Rate-limit retry wrapper ────────────────────────────────────────────── */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, retries = 5): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries - 1) throw err;
      const msg = (err as Error).message;
      if (
        msg.includes("Rate limit") ||
        msg.includes("429") ||
        msg.includes("Too Many Requests")
      ) {
        const match = msg.match(/try again in ([\d.]+)s/);
        const delay = match ? Number(match[1]) * 1000 + 3000 : Math.min(1000 * 2 ** attempt, 15_000);
        await sleep(delay);
        continue;
      }
      if (
        msg.includes("timeout") ||
        msg.includes("timed out") ||
        msg.includes("ETIMEDOUT")
      ) {
        await sleep(2000 * 2 ** attempt);
        continue;
      }
      if (msg.includes("does not match the expected schema") || msg.includes("jsonschema")) {
        await sleep(1000 * 2 ** attempt);
        continue;
      }
      throw err;
    }
  }
}

/* ── Schema → readable field descriptor ──────────────────────────────────── */
function describeType(schema: z.ZodType<unknown>, indent = 0): string {
  const pad = "  ".repeat(indent);
  const inner = (schema as unknown as { _def?: { shape?: Record<string, z.ZodType<unknown>>; element?: z.ZodType<unknown> } })._def;

  if (inner?.shape) {
    const fields = Object.entries(inner.shape).map(([key, field]) =>
      `${pad}  "${key}": ${describeType(field as z.ZodType<unknown>, indent + 1)}`,
    );
    return `{\n${fields.join(",\n")}\n${pad}}`;
  }

  if (inner?.element) {
    return `[${describeType(inner.element, indent)}]`;
  }

  const typeName = (schema.constructor?.name ?? "").toLowerCase();
  if (typeName.includes("number")) return "123";
  if (typeName.includes("boolean")) return "true";
  return `"string"`;
}

function describeSchema(schema: z.ZodType<unknown>): string {
  return describeType(schema);
}

/**
 * Whether a real LLM is available (key present for the active provider).
 * When false, agents fall back to deterministic heuristics so the whole
 * pipeline runs keyless — same philosophy as the simulated video provider.
 */
export function hasLLM(): boolean {
  if (PROVIDER === "groq") return Boolean(process.env.GROQ_API_KEY);
  if (PROVIDER === "crusoe") return Boolean(process.env.CRUSOE_API_KEY);
  if (PROVIDER === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.AI_GATEWAY_API_KEY);
}

export async function genObject<T>(
  schema: z.ZodType<T>,
  prompt: string,
  system?: string,
  agent?: AgentId,
): Promise<T> {
  const modelName = agent && !ALL_SAME ? AGENT_MODEL[agent] : DEFAULT_MODEL;

  if (supportsJsonSchema(modelName)) {
    try {
      const { object } = await withRetry(() =>
        generateObject({
          model: resolveModel(agent),
          schema,
          prompt,
          system,
          maxRetries: 0,
        }),
      );
      return object as T;
    } catch (err) {
      const msg = (err as Error).message;
      if (!msg.includes("jsonschema") && !msg.includes("does not match the expected schema")) {
        throw err;
      }
      /* jsonschema failed — fall through to text-gen path */
    }
  }

  /* Fallback: text-gen → JSON parse → Zod validate (with retries). */
  const schemaDesc = describeSchema(schema);
  const basePrompt = `${prompt}\n\nOutput ONLY a raw JSON object matching this structure exactly:\n${schemaDesc}\nNo markdown, no code fences, no explanation.`;
  const baseSystem = system
    ? `${system}\nYou output only raw JSON.`
    : "You output only raw JSON.";

  for (let attempt = 0; attempt < 3; attempt++) {
    const text = await genText(basePrompt, baseSystem, agent);
    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim();
    try {
      return schema.parse(JSON.parse(cleaned));
    } catch (err) {
      if (attempt === 2) throw new Error(
        `Structured output parse failed after 3 attempts: ${(err as Error).message}`,
      );
    }
  }

  throw new Error("Unreachable");
}

export async function genText(
  prompt: string,
  system?: string,
  agent?: AgentId,
): Promise<string> {
  const { text } = await withRetry(() =>
    generateText({
      model: resolveModel(agent),
      prompt,
      system,
      maxRetries: 0,
    }),
  );
  return text.trim();
}
