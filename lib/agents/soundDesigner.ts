import type { ShotSpec } from "@/lib/pipeline/types";
import { genObject, hasLLM } from "@/lib/providers/llm";
import { z } from "zod";

const SoundNotesSchema = z.object({
  atmos: z.string(),
  foley: z.string(),
  note: z.string(),
});

const ATMOS = [
  "distant city hum, low-frequency rumble",
  "wind through trees, rustling leaves",
  "rain on asphalt, gutter trickle",
  "mechanical hum, fluorescent buzz",
  "ocean waves, seagull calls",
  "dead silence, room tone only",
];

const FOLEY = [
  "footsteps on wet pavement, fabric rustle",
  "door creak, paper shuffle",
  "engine idle, distant traffic",
  "glass clink, chair scrape",
  "breath, heartbeat overlay",
  "keyboard clatter, phone buzz",
];

/** Sound Designer agent: shot → atmos, foley, and mix notes. */
export async function designSound(shot: ShotSpec): Promise<{ atmos: string; foley: string; note: string }> {
  if (hasLLM()) {
    return genObject(
      SoundNotesSchema,
      `Describe the sound design for this shot: "${shot.description}" (camera: ${shot.camera}, mood: ${shot.mood}).
Atmos: one-line ambient environment.
Foley: one-line practical sound effects.
Note: one-line mix direction.`,
      "You are a sound designer for film. Be specific and cinematic.",
    );
  }
  return {
    atmos: ATMOS[shot.index % ATMOS.length],
    foley: FOLEY[shot.index % FOLEY.length],
    note: `Mix ${shot.mood} — keep atmos wide, foley dry.`,
  };
}
