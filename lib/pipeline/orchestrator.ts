import type { PipelineEvent } from "./types";
import type { VideoProvider } from "@/lib/providers/video";
import { createProvider } from "@/lib/providers/video";
import { createFilmGraph } from "./graph";
import { assembleFilm } from "@/lib/ffmpeg/assemble";

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
  targetLength = "5s",
): AsyncGenerator<PipelineEvent> {
  const channel: PipelineEvent[] = [];
  let filmManifest: Extract<PipelineEvent, { type: "film" }>["manifest"] | null = null;

  const emit = (e: PipelineEvent) => {
    if (e.type === "film") filmManifest = e.manifest;
    channel.push(e);
  };

  const provider: VideoProvider = createProvider(providerKind);
  const graph = createFilmGraph(emit, provider);

  let graphDone = false;
  let graphError: string | null = null;

  /* Run the graph in a background promise while we yield events as they arrive. */
  const runGraph = graph
    .invoke({ idea, aspect, targetLength })
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
