import { fal } from "@fal-ai/client";
import type { VideoProvider, GenerateShotInput } from "./interface";
import type { ShotRender } from "@/lib/pipeline/types";

export class FalVideoProvider implements VideoProvider {
  readonly name: string;
  private readonly model: string;
  private readonly isSeedance: boolean;
  private readonly isLtx: boolean;

  /**
   * @param model — fal.ai model ID, e.g. "fal-ai/ltx-2/text-to-video/fast"
   *                or "bytedance/seedance-2.0/fast/text-to-video"
   */
  constructor(model?: string) {
    if (!process.env.FAL_KEY) {
      throw new Error("[video] FAL_KEY is not set");
    }
    this.model = model ?? process.env.FAL_VIDEO_MODEL ?? "fal-ai/ltx-2/text-to-video/fast";
    this.isSeedance = this.model.includes("seedance");
    this.isLtx = this.model.includes("ltx");
    this.name = this.isSeedance ? "seedance" : "fal";
  }

  async generateShot(input: GenerateShotInput): Promise<ShotRender> {
    const { shot } = input;
    const dur = Math.max(2, Math.round(shot.durationSec));

    if (this.isLtx) {
      return this.generateLtx(input, dur);
    }
    if (this.isSeedance) {
      return this.generateSeedance(input, dur);
    }
    /* Fallback — generic passthrough (may fail if model rejects params). */
    return this.generateGeneric(input, dur);
  }

  /* ── LTX-2 (both Pro and Fast) ───────────────────────────────────── */
  private async generateLtx(input: GenerateShotInput, dur: number): Promise<ShotRender> {
    const validDurations = this.model.includes("/fast") ? [6, 8, 10, 12, 14, 16, 18, 20] : [6, 8, 10];
    const d = validDurations.find((v) => v >= dur) ?? validDurations[validDurations.length - 1];
    const res = mapResolution(input.resolution ?? "720p", ["1080p", "1440p", "2160p"]);

    const modelInput: Record<string, unknown> = {
      prompt: input.prompt,
      duration: d,
      resolution: res,
      generate_audio: true,
    };

    return this.run(modelInput, input.shot.id, dur);
  }

  /* ── Seedance 2.0 ─────────────────────────────────────────────────── */
  private async generateSeedance(input: GenerateShotInput, dur: number): Promise<ShotRender> {
    const validDurations = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    const d = validDurations.find((v) => v >= dur) ?? validDurations[validDurations.length - 1];
    const res = mapResolution(input.resolution ?? "720p", ["480p", "720p"]);

    const modelInput: Record<string, unknown> = {
      prompt: input.prompt,
      duration: String(d),
      resolution: res,
      aspect_ratio: input.aspect ?? "16:9",
      generate_audio: true,
    };

    return this.run(modelInput, input.shot.id, dur);
  }

  /* ── Generic fallback ─────────────────────────────────────────────── */
  private async generateGeneric(input: GenerateShotInput, dur: number): Promise<ShotRender> {
    const modelInput: Record<string, unknown> = { prompt: input.prompt };
    if (input.aspect) modelInput.aspect_ratio = input.aspect;
    modelInput.num_frames = Math.min(Math.max(dur * 24, 25), 481);
    return this.run(modelInput, input.shot.id, dur);
  }

  /* ── Shared: call fal.subscribe and map result ────────────────────── */
  private async run(modelInput: Record<string, unknown>, shotId: string, durationSec: number): Promise<ShotRender> {
    const result = await fal.subscribe(this.model, { input: modelInput });
    const data =
      (result as { data?: Record<string, unknown> }).data ??
      (result as Record<string, unknown>);
    const video = (data as { video?: { url?: string } }).video;
    const url = video?.url ?? (data as { url?: string }).url;
    if (!url) throw new Error("[video] fal returned no video url");

    return {
      shotId,
      url,
      kind: "video",
      durationSec,
      provider: this.name,
      meta: { model: this.model },
    };
  }
}

function mapResolution(userRes: string, valid: string[]): string {
  const num = parseInt(userRes.replace("p", ""), 10) || 720;
  let best = valid[0];
  for (const v of valid) {
    const vn = parseInt(v.replace("p", ""), 10);
    if (vn <= num) best = v;
  }
  return best;
}
