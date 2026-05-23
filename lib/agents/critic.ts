import { z } from "zod";
import type { ShotSpec } from "@/lib/pipeline/types";
import type { ShotResult } from "@/lib/pipeline/graph";
import { genObject, hasLLM } from "@/lib/providers/llm";

const EditNotesSchema = z.object({
  pace: z.string(),
  transitions: z.string(),
  note: z.string(),
});

/** Editor agent: reviews all produced shots → pacing, transitions, final note. */
export async function editFilm(
  shots: ShotSpec[],
  _results: Record<string, ShotResult>,
): Promise<{ pace: string; transitions: string; note: string }> {
  if (hasLLM()) {
    const descs = shots
      .map((s, i) => `Shot ${i + 1} (${s.durationSec}s, ${s.camera}, ${s.mood}): ${s.description}`)
      .join("\n");
    return genObject(
      EditNotesSchema,
      `Review this film cut and provide edit notes.\n\n${descs}\n\nPace: one line about overall rhythm and timing.\nTransitions: how shots flow together.\nNote: one-line final assessment.`,
      "You are a film editor. Be precise about pacing and continuity.",
      "editor",
    );
  }
  const total = shots.reduce((s, x) => s + x.durationSec, 0);
  return {
    pace: `${shots.length} shots, ${total}s total — steady rhythm across beats.`,
    transitions: `${shots[0]?.camera ?? "cuts"} opening, ${shots[shots.length - 1]?.camera ?? "cuts"} closing.`,
    note: "Assembly complete. Clean edit with coherent visual flow.",
  };
}
