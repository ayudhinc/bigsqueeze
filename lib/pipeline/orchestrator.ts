import type { PipelineEvent } from "./types";
import type { VideoProvider } from "@/lib/providers/video";
import { createProvider } from "@/lib/providers/video";
import { createFilmGraph } from "./graph";
import { assembleFilm } from "@/lib/ffmpeg/assemble";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const RENDERS_DIR = join(process.cwd(), "public", "renders");

function download(url: string, dest: string) {
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 120_000 });
}

const pollMs = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * The Director: runs the full filmmaking pipeline as a LangGraph state
 * machine and yields a stream of PipelineEvents for the live timeline UI.
 *
 * Events are yielded in real-time as the graph emits them, so the client
 * sees agent/ shot progress live rather than a single burst at the end.
 *
 * @param idea       — the logline / film idea
 * @param providerKind — which video provider to use (simulated, fal/ltx-2, etc.)
 */
export async function* runPipeline(
  idea: string,
  providerKind = "simulated",
  aspect = "16:9",
  resolution = "720p",
  targetLength = "5s",
): AsyncGenerator<PipelineEvent> {
  const channel: PipelineEvent[] = [];
  let filmManifest: Extract<PipelineEvent, { type: "film" }>["manifest"] | null = null;

  const slug =
    idea.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "film";
  const runId = `${slug}-${Date.now()}`;
  const runDir = join(RENDERS_DIR, runId);

  const emit = (e: PipelineEvent) => {
    if (e.type === "shot" && e.status === "ready" && e.render) {
      if (e.render.kind === "video" && !e.render.url.startsWith("data:")) {
        const dest = join(runDir, `shot-${e.render.shotId}.mp4`);
        mkdirSync(runDir, { recursive: true });
        download(e.render.url, dest);
        e.render.url = `/renders/${runId}/shot-${e.render.shotId}.mp4`;
      }
    }
    if (e.type === "film") filmManifest = e.manifest;
    channel.push(e);
  };

  const provider: VideoProvider = createProvider(providerKind);
  const graph = createFilmGraph(emit, provider);

  let graphDone = false;
  let graphError: string | null = null;

  /* Run the graph in a background promise while we yield events as they arrive. */
  void graph
    .invoke({ idea, aspect, resolution, targetLength })
    .then(() => { graphDone = true; })
    .catch((err: unknown) => {
      graphError = err instanceof Error ? err.message : String(err);
      graphDone = true;
    });

  /* Drain the channel in a polling loop until the graph finishes. */
  while (!graphDone) {
    while (channel.length > 0) {
      yield channel.shift()!;
    }
    await pollMs(50);
  }
  while (channel.length > 0) {
    yield channel.shift()!;
  }

  /* Surface any graph-level error at the end. */
  if (graphError) {
    yield { type: "error", message: graphError };
    throw new Error(graphError);
  }

  /* ── Post-graph: ffmpeg assembly ─────────────────────────────────────── */
  if (filmManifest) {
    const url = assembleFilm(filmManifest);
    yield { type: "film", url, manifest: filmManifest };
  }
}
