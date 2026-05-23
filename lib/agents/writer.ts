import { z } from "zod";
import type { Treatment } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";

const TreatmentSchema = z.object({
  logline: z.string(),
  synopsis: z.string(),
  beats: z.array(z.string()).min(3).max(6),
});

/** Writer agent: idea → treatment (logline, synopsis, story beats). */
export async function writeTreatment(idea: string): Promise<Treatment> {
  if (hasLLM()) {
    return genObject(
      TreatmentSchema,
      `Develop this idea into a short-film treatment.\nIdea: ${idea}\n\nReturn a punchy logline, a 2-3 sentence synopsis, and 4-5 visual story beats (each one concrete, filmable sentence).`,
      "You are a sharp film writer. Be concrete, visual, and concise.",
    );
  }
  return {
    logline: idea,
    synopsis: `A short film exploring "${idea}".`,
    beats: [
      `Establishing image that introduces the world of: ${idea}`,
      "An inciting moment disrupts the status quo",
      "Rising tension as the central want collides with an obstacle",
      "A turning point that reframes everything",
      "A resonant final image that lands the theme",
    ],
  };
}
