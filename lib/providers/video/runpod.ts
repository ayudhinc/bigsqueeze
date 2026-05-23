import type { VideoProvider, GenerateShotInput } from "./interface";
import type { ShotRender } from "@/lib/pipeline/types";

export class RunpodVideoProvider implements VideoProvider {
  readonly name = "runpod";
  private readonly model: string;

  constructor(model?: string) {
    this.model = model ?? "runpod/ltx-2";
  }

  async generateShot(_input: GenerateShotInput): Promise<ShotRender> {
    throw new Error(`[video] runpod provider (${this.model}) not implemented yet`);
  }
}
