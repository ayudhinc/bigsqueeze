import type { ShotSpec, ShotRender } from "@/lib/pipeline/types";

export type GenerateShotInput = {
  /** The fully-formed generation prompt from the Prompt Smith agent. */
  prompt: string;
  shot: ShotSpec;
  /** Optional reference image (data URI or URL) for character/style consistency. */
  referenceImageUrl?: string;
};

export interface VideoProvider {
  readonly name: string;
  generateShot(input: GenerateShotInput): Promise<ShotRender>;
}
