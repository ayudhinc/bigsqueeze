import type { VideoProvider } from "./interface";
import { SimulatedVideoProvider } from "./simulated";
import { FalVideoProvider } from "./fal";

let cached: VideoProvider | null = null;

/** Selects the video provider from VIDEO_PROVIDER (simulated | fal | runpod). */
export function getVideoProvider(): VideoProvider {
  if (cached) return cached;
  const choice = (process.env.VIDEO_PROVIDER ?? "simulated").toLowerCase();
  switch (choice) {
    case "fal":
      cached = new FalVideoProvider();
      break;
    case "runpod":
      throw new Error("[video] runpod provider not implemented yet — use simulated or fal");
    case "simulated":
    default:
      cached = new SimulatedVideoProvider();
  }
  return cached;
}

export type { VideoProvider, GenerateShotInput } from "./interface";
