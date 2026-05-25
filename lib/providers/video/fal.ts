import { fal } from "@fal-ai/client";
import type { VideoProvider, GenerateShotInput } from "./interface";
import type { ShotRender } from "@/lib/pipeline/types";

export class FalVideoProvider implements VideoProvider {
  readonly name: string;
  private readonly model: string;

  /**
   * @param model — fal.ai model ID, e.g. "fal-ai/ltx-2/text-to-video/fast"
   *                or "bytedance/seedance-2.0/fast/text-to-video"
   */
  constructor(model?: string) {
    if (!process.env.FAL_KEY) {
      throw new Error("[video] FAL_KEY is not set");
    }
    this.model = model ?? process.env.FAL_VIDEO_MODEL ?? "fal-ai/ltx-2/text-to-video/fast";
    this.name = this.model.includes("seedance") ? "seedance" : "fal";
  }

  async generateShot(input: GenerateShotInput): Promise<ShotRender> {
    const { shot } = input;
    const modelInput: Record<string, unknown> = { prompt: input.prompt };
    if (input.aspect) {
      modelInput.aspect_ratio = input.aspect;
      if (input.resolution) {
        const { w, h } = aspectRes(input.aspect, input.resolution);
        modelInput.width = w;
        modelInput.height = h;
      }
    }
    const frames = Math.round(shot.durationSec * 24);
    modelInput.num_frames = Math.min(Math.max(frames, 25), 481);
    const result = await fal.subscribe(this.model, {
      input: modelInput,
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

function aspectRes(aspect: string, resolution: string): { w: number; h: number } {
  const parts = aspect.split(":").map(Number);
  const ratio = parts[0] / parts[1];
  const h = parseInt(resolution.replace("p", ""), 10) || 720;
  const w = Math.round(h * ratio);
  return { w, h };
}
