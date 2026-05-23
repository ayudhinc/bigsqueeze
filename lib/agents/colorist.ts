import type { ShotSpec } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";
import { z } from "zod";

const ColorNotesSchema = z.object({
  palette: z.string(),
  contrast: z.string(),
  grade: z.string(),
});

const PALETTES = [
  "teal shadows, warm tungsten highlights",
  "desaturated amber, crushed blacks",
  "cool blue, lifted shadows, skin-tone magenta",
  "high-contrast cyan, deep underexposed bg",
  "golden hour warmth, soft highlights",
  "green-tinged fluorescent, cold skin tones",
];

/** Colorist agent: shot → color palette, contrast, grade direction. */
export async function gradeShot(shot: ShotSpec): Promise<{ palette: string; contrast: string; grade: string }> {
  if (hasLLM()) {
    return genObject(
      ColorNotesSchema,
      `Color grade this shot: "${shot.description}" (camera: ${shot.camera}, mood: ${shot.mood}).
Palette: key color tones.
Contrast: shadow/midtone/highlight treatment.
Grade: one-line look reference.`,
      "You are a film colorist. Be specific about color temperatures and contrast ratios.",
    );
  }
  return {
    palette: PALETTES[shot.index % PALETTES.length],
    contrast: `${shot.mood === "tense" || shot.mood === "eerie" ? "high" : "soft"} contrast, ${["lifted blacks", "crushed shadows", "smooth roll-off", "pushed mids"][shot.index % 4]}`,
    grade: `${shot.mood} ${shot.camera} look — ` + ["warm skin preservation", "cool atmosphere", "natural skin tones", "bleach bypass"][shot.index % 4],
  };
}
