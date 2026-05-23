import { z } from "zod";
import type { ShotSpec } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";

const NoteSchema = z.object({
  ok: z.boolean(),
  note: z.string(),
});

/** Critic agent: reviews a shot's prompt; ok=true praise, ok=false one-line fix. */
export async function critiqueShot(
  shot: ShotSpec,
  prompt: string,
): Promise<{ ok: boolean; note: string }> {
  if (hasLLM()) {
    return genObject(
      NoteSchema,
      `Critique this shot prompt for clarity and visual impact. If strong, ok=true with a one-line compliment. If weak, cliché, or unfilmable, ok=false with a one-line fix.\n\nShot: ${shot.description}\nPrompt: ${prompt}`,
      "You are a tough but fair film critic. Respond in one sentence.",
      "editor",
    );
  }
  return {
    ok: true,
    note: `Reads clean — the ${shot.mood} ${shot.camera} suits beat ${shot.index + 1}.`,
  };
}
