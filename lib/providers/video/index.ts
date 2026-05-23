import type { VideoProvider } from "./interface";
import { SimulatedVideoProvider } from "./simulated";
import { FalVideoProvider } from "./fal";
import { RunpodVideoProvider } from "./runpod";

type ProviderKind = "simulated" | "fal/ltx-2" | "fal/seedance-2.0" | "runpod/ltx-2";

function modelForKind(kind: ProviderKind): VideoProvider {
  switch (kind) {
    case "simulated":
      return new SimulatedVideoProvider();
    case "fal/ltx-2":
      return new FalVideoProvider("fal-ai/ltx-2/text-to-video/fast");
    case "fal/seedance-2.0":
      return new FalVideoProvider("bytedance/seedance-2.0/fast/text-to-video");
    case "runpod/ltx-2":
      return new RunpodVideoProvider("runpod/ltx-2");
  }
}

let cached: VideoProvider | null = null;

/** Selects the video provider from VIDEO_PROVIDER env var (simulated | fal | runpod). */
export function getVideoProvider(): VideoProvider {
  if (cached) return cached;
  const choice = (process.env.VIDEO_PROVIDER ?? "simulated").toLowerCase();
  switch (choice) {
    case "fal":
      cached = new FalVideoProvider();
      break;
    case "runpod":
      cached = new RunpodVideoProvider();
      break;
    case "simulated":
    default:
      cached = new SimulatedVideoProvider();
  }
  return cached;
}

/**
 * Create a provider for a specific kind, bypassing the env-based singleton.
 * Used by the pipeline to honour the user's per-run selection.
 */
export function createProvider(kind: string): VideoProvider {
  return modelForKind(kind as ProviderKind);
}

export type { VideoProvider, GenerateShotInput } from "./interface";
export type { ProviderKind };
