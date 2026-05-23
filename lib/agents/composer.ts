import type { ShotSpec } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";
import { z } from "zod";

const ScoreNotesSchema = z.object({
  theme: z.string(),
  instrumentation: z.string(),
  tempo: z.string(),
});

const THEMES = [
  "lonely noir — lone trumpet over sparse piano",
  "building tension — repeating cello ostinato",
  "wonder — shimmering strings, soft glockenspiel",
  "urgency — staccato strings, driving percussion",
  "resolve — warm horns, full string section",
  "descent — low brass, eerie synth pad",
];

/** Composer agent: shot → score theme, instrumentation, tempo. */
export async function composeScore(shot: ShotSpec): Promise<{ theme: string; instrumentation: string; tempo: string }> {
  if (hasLLM()) {
    return genObject(
      ScoreNotesSchema,
      `Score this shot: "${shot.description}" (camera: ${shot.camera}, mood: ${shot.mood}).
Theme: one-line melodic or atmospheric description.
Instrumentation: which instruments carry the moment.
Tempo: BPM range and feel.`,
      "You are a film composer. Respond with musical precision.",
    );
  }
  return {
    theme: THEMES[shot.index % THEMES.length],
    instrumentation: `${shot.mood} strings, solo ${["piano", "cello", "clarinet", "trumpet", "oboe", "viola"][shot.index % 6]}`,
    tempo: `${60 + shot.index * 8} BPM, ${shot.mood} feel`,
  };
}
