// Core domain types for the Big Squeeze pipeline.

export type Treatment = {
  logline: string;
  synopsis: string;
  beats: string[];
};

export type ShotSpec = {
  id: string;
  index: number;
  description: string;
  durationSec: number;
  camera?: string;
  mood?: string;
};

export type ShotRender = {
  shotId: string;
  /** mp4 URL (fal/runpod) or a data-URI SVG (simulated). */
  url: string;
  kind: "video" | "svg";
  posterUrl?: string;
  audioUrl?: string;
  durationSec: number;
  provider: string;
  meta?: Record<string, unknown>;
};

export type ShotStatus = "queued" | "rendering" | "ready" | "failed";

/** Events streamed from the orchestrator to the live timeline UI. */
export type PipelineEvent =
  | { type: "agent"; agent: string; status: "start" | "done"; message?: string }
  | { type: "treatment"; treatment: Treatment }
  | { type: "shots"; shots: ShotSpec[] }
  | { type: "shot"; shotId: string; status: ShotStatus; render?: ShotRender }
  | { type: "film"; url?: string; manifest: FilmManifest }
  | { type: "error"; message: string };

export type FilmManifest = {
  logline: string;
  shots: Array<{
    shot: ShotSpec;
    prompt: string;
    render?: ShotRender;
  }>;
  provider: string;
  createdAt: string;
};
