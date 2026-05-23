import { z } from "zod";
import type { Treatment, ShotSpec } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";

const ShotsSchema = z.object({
  shots: z
    .array(
      z.object({
        description: z.string(),
        durationSec: z.number().min(2).max(10),
        camera: z.string(),
        mood: z.string(),
      }),
    )
    .min(3)
    .max(8),
});

const CAMERAS = [
  "wide establishing",
  "slow push-in",
  "low-angle tracking",
  "intimate close-up",
  "overhead",
  "handheld follow",
];
const MOODS = ["serene", "tense", "wondrous", "melancholic", "triumphant", "eerie"];

/** Shot Designer agent: treatment → ordered, filmable shot list. */
export async function breakIntoShots(treatment: Treatment): Promise<ShotSpec[]> {
  let raw: Array<{ description: string; durationSec: number; camera: string; mood: string }>;

  if (hasLLM()) {
    const out = await genObject(
      ShotsSchema,
      `Break this treatment into 4-6 filmable shots for an AI video model.\nEach shot: a vivid one-sentence visual description, a duration (3-8s), a camera move, and a mood.\n\nLogline: ${treatment.logline}\nSynopsis: ${treatment.synopsis}\nBeats:\n${treatment.beats.map((b, i) => `${i + 1}. ${b}`).join("\n")}`,
      "You are a cinematographer planning coverage. Each shot must be self-contained and visual.",
    );
    raw = out.shots;
  } else {
    raw = treatment.beats.map((b, i) => ({
      description: b,
      durationSec: 5,
      camera: CAMERAS[i % CAMERAS.length],
      mood: MOODS[i % MOODS.length],
    }));
  }

  return raw.map((s, i) => ({
    id: `shot-${i + 1}`,
    index: i,
    description: s.description,
    durationSec: Math.round(s.durationSec),
    camera: s.camera,
    mood: s.mood,
  }));
}
