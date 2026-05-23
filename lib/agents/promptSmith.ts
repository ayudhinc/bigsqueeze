import type { ShotSpec } from "@/lib/pipeline/types";
import { genText, hasLLM } from "@/lib/providers/llm";

/** Prompt Smith agent: shot + style → a text-to-video prompt for LTX-2. */
export async function writeShotPrompt(shot: ShotSpec, styleContext: string): Promise<string> {
  if (hasLLM()) {
    return genText(
      `Write a single vivid text-to-video prompt for this shot. Include subject, action, setting, lighting, lens/camera move, and mood. One paragraph, no preamble.\n\nStyle/world: ${styleContext}\nShot: ${shot.description}\nCamera: ${shot.camera}\nMood: ${shot.mood}`,
      "You write precise prompts for an AI video model (LTX-2). Be concrete and cinematic.",
      "dp",
    );
  }
  return `${shot.description}. ${shot.camera} shot, ${shot.mood} mood, cinematic lighting, shallow depth of field, filmic grain. World: ${styleContext}.`;
}
