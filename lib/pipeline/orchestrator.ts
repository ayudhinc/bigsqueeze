import type { PipelineEvent } from "./types";
import type { VideoProvider } from "@/lib/providers/video";
import { createProvider } from "@/lib/providers/video";
import { createFilmGraph } from "./graph";
import { assembleFilm } from "@/lib/ffmpeg/assemble";

type GraphResult = { ok: true } | { ok: false; error: Error };

/**
 * The Director: runs the full filmmaking pipeline as a LangGraph state
 * machine and yields a stream of PipelineEvents for the live timeline UI.
 *
 * @param idea       — the logline / film idea
 * @param providerKind — which video provider to use (simulated, fal/ltx-2, etc.)
 */
export async function* runPipeline(
  idea: string,
  providerKind = "simulated",
  aspect = "16:9",
  targetLength = "60s",
): AsyncGenerator<PipelineEvent> {
  const events: PipelineEvent[] = [];

  const provider: VideoProvider = createProvider(providerKind);

  const emit = (e: PipelineEvent) => {
    events.push(e);
  };

  /* Build and start the graph (event-emit callbacks fire inside nodes). */
  const graph = createFilmGraph(emit, provider);
  const result: GraphResult = await graph
    .invoke({ idea, aspect, targetLength })
    .then(() => ({ ok: true as const }))
    .catch((err: unknown) => ({
      ok: false as const,
      error: err instanceof Error ? err : new Error(String(err)),
    }));

  /* Yield all accumulated events. */
  for (const event of events) {
    yield event;
  }

  /* Surface any graph-level error at the end. */
  if (!result.ok) {
    yield { type: "error", message: result.error.message };
    throw result.error;
  }

  /* ── Post-graph: ffmpeg assembly ─────────────────────────────────────── */
  const filmEvent = events.findLast(
    (e): e is Extract<PipelineEvent, { type: "film" }> => e.type === "film",
  );
  if (filmEvent) {
    const url = assembleFilm(filmEvent.manifest);
    yield { type: "film", url, manifest: filmEvent.manifest };
  }
}
