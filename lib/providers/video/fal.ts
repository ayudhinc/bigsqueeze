import { fal } from "@fal-ai/client";
import type { VideoProvider, GenerateShotInput } from "./interface";
import type { ShotRender } from "@/lib/pipeline/types";

/**
 * fal.ai LTX-2 adapter. Reads FAL_KEY from the environment automatically.
 * Model + input schema follow the LTX-2 model pages (fal-ai/ltx-2/...).
 * Output is parsed defensively; confirm exact knobs (resolution, duration,
 * aspect_ratio) against the chosen model's schema when wiring real keys.
 */
export class FalVideoProvider implements VideoProvider {
  readonly name = "fal";
  private readonly model: string;

  constructor() {
    if (!process.env.FAL_KEY) {
      throw new Error("[video] VIDEO_PROVIDER=fal but FAL_KEY is not set");
    }
    this.model = process.env.FAL_VIDEO_MODEL ?? "fal-ai/ltx-2/text-to-video/fast";
  }

  async generateShot(input: GenerateShotInput): Promise<ShotRender> {
    const { shot } = input;
    const result = await fal.subscribe(this.model, {
      input: {
        prompt: input.prompt,
        // TODO: confirm knobs against the model schema (resolution / duration /
        // num_frames / aspect_ratio). Kept minimal for portability across LTX-2 variants.
      },
    });

    const data =
      (result as { data?: Record<string, unknown> }).data ??
      (result as Record<string, unknown>);
    const video = (data as { video?: { url?: string } }).video;
    const url = video?.url ?? (data as { url?: string }).url;
    if (!url) throw new Error("[video] fal returned no video url");

    return {
      shotId: shot.id,
      url,
      kind: "video",
      durationSec: shot.durationSec,
      provider: this.name,
      meta: { model: this.model },
    };
  }
}
