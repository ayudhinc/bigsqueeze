import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import type { Treatment, ShotSpec, ShotRender, PipelineEvent, FilmManifest } from "./types";
import { writeTreatment } from "@/lib/agents/writer";
import { breakIntoShots } from "@/lib/agents/shotBreakdown";
import { writeShotPrompt } from "@/lib/agents/promptSmith";
import { designSound } from "@/lib/agents/soundDesigner";
import { composeScore } from "@/lib/agents/composer";
import { gradeShot } from "@/lib/agents/colorist";
import { editFilm } from "@/lib/agents/critic";
import { getVideoProvider, type VideoProvider } from "@/lib/providers/video";

/* ──────────────────────────────────────────────────────────────────────────
   Per-shot result bag accumulated across cinematographer → renderer → post.
   ────────────────────────────────────────────────────────────────────────── */
export type ShotResult = {
  shot: ShotSpec;
  prompt?: string;
  render?: ShotRender;
  sound?: { atmos: string; foley: string; note: string };
  score?: { theme: string; instrumentation: string; tempo: string };
  color?: { palette: string; contrast: string; grade: string };
};

/* ──────────────────────────────────────────────────────────────────────────
   LangGraph state — each field is independently mergeable via its reducer.
   ────────────────────────────────────────────────────────────────────────── */
const FilmState = Annotation.Root({
  idea: Annotation<string>,

  aspect: Annotation<string>,

  resolution: Annotation<string>,

  targetLength: Annotation<string>,

  treatment: Annotation<Treatment | null>({ reducer: (a, b) => b ?? a }),

  shots: Annotation<ShotSpec[]>({ reducer: (a, b) => b ?? a, default: () => [] }),

  currentShotIndex: Annotation<number>({
    reducer: (a, b) => b ?? a,
    default: () => 0,
  }),

  prompt: Annotation<string | null>({ reducer: (a, b) => b ?? a }),

  shotResults: Annotation<Record<string, ShotResult>>({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({}),
  }),

  shotRevisions: Annotation<Record<string, number>>({
    reducer: (a, b) => ({ ...a, ...b }),
    default: () => ({}),
  }),

  maxRevisions: Annotation<number>({
    reducer: (a, b) => b ?? a,
    default: () => 3,
  }),

  errors: Annotation<string[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),

  manifest: Annotation<FilmManifest | null>({ reducer: (a, b) => b ?? a }),
});

type St = typeof FilmState.State;
type Up = typeof FilmState.Update;

export type { St as FilmGraphState, Up as FilmGraphUpdate };

/* ──────────────────────────────────────────────────────────────────────────
   Graph builder — called once per pipeline run with an emit callback so
   nodes can stream PipelineEvents in real time. The graph encodes:

   START → screenwriter → director → cinematographer → renderer
          → postProduction → qcRouter
              ├── retryShot → cinematographer  (render failed, retries remain)
              └── advanceShot → advanceRouter
                    ├── cinematographer  (more shots)
                    └── editor → END     (all shots done)
   ────────────────────────────────────────────────────────────────────────── */
export function createFilmGraph(emit: (e: PipelineEvent) => void, provider?: VideoProvider) {
  const _provider = provider ?? getVideoProvider();
  const style = (st: St) => `${st.treatment!.logline} — ${st.treatment!.synopsis}`;
  const currentShot = (st: St) => st.shots[st.currentShotIndex];

  /* ── 1. Screenwriter ─────────────────────────────────────────────────── */
  async function screenwriter(st: St): Promise<Up> {
    emit({ type: "agent", agent: "Screenwriter", status: "start" });
    const treatment = await writeTreatment(st.idea);
    emit({ type: "treatment", treatment });
    emit({ type: "agent", agent: "Screenwriter", status: "done", message: treatment.logline });
    return { treatment };
  }

  /* ── 2. Director — treatment → shot list ─────────────────────────────── */
  async function directorNode(st: St): Promise<Up> {
    emit({ type: "agent", agent: "Director", status: "start" });
    const shots = await breakIntoShots(st.treatment!, st.targetLength);
    emit({ type: "shots", shots });
    emit({
      type: "agent",
      agent: "Director",
      status: "done",
      message: `${shots.length} shots planned — ${shots.map((s) => s.mood).join(", ")}`,
    });
    return { shots };
  }

  /* ── 3a. Cinematographer — per-shot prompt ───────────────────────────── */
  async function cinematographer(st: St): Promise<Up> {
    const shot = currentShot(st);
    const rev = st.shotRevisions[shot.id] ?? 0;
    const revTag = rev > 0 ? ` (revision ${rev})` : "";
    emit({
      type: "agent",
      agent: "Cinematographer",
      status: "start",
      message: `shot ${shot.index + 1} — ${shot.description.slice(0, 60)}${revTag}`,
    });
    const prompt = await writeShotPrompt(shot, style(st));
    emit({ type: "agent", agent: "Cinematographer", status: "done", message: prompt });
    return { prompt, shotResults: { [shot.id]: { shot, prompt } as ShotResult } };
  }

  /* ── 3b. Renderer ────────────────────────────────────────────────────── */
  async function renderer(st: St): Promise<Up> {
    const shot = currentShot(st);
    emit({ type: "shot", shotId: shot.id, status: "rendering" });
    try {
      const render = await _provider.generateShot({ prompt: st.prompt ?? "", shot, aspect: st.aspect, resolution: st.resolution });
      emit({ type: "shot", shotId: shot.id, status: "ready", render });
      return {
        shotResults: {
          [shot.id]: { ...st.shotResults[shot.id], render } as ShotResult,
        },
      };
    } catch (err) {
      const msg = `Shot ${shot.index + 1} render failed: ${(err as Error).message}`;
      emit({ type: "shot", shotId: shot.id, status: "failed" });
      emit({ type: "error", message: msg });
      return { errors: [msg] };
    }
  }

  /* ── 3c–e. Post-production — Sound + Score + Color in parallel ───────── */
  async function postProduction(st: St): Promise<Up> {
    const shot = currentShot(st);
    const idx = shot.index + 1;

    emit({ type: "agent", agent: "Sound Designer", status: "start", message: `shot ${idx}` });
    emit({ type: "agent", agent: "Composer", status: "start", message: `shot ${idx}` });
    emit({ type: "agent", agent: "Colorist", status: "start", message: `shot ${idx}` });

    /* Run sequentially to avoid Groq free-tier rate limits (8K TPM). */
    const sound = await designSound(shot);
    const score = await composeScore(shot);
    const color = await gradeShot(shot);

    emit({
      type: "agent",
      agent: "Sound Designer",
      status: "done",
      message: `${sound.atmos} · ${sound.foley}`,
    });
    emit({
      type: "agent",
      agent: "Composer",
      status: "done",
      message: `${score.theme} · ${score.tempo}`,
    });
    emit({
      type: "agent",
      agent: "Colorist",
      status: "done",
      message: `${color.palette} · ${color.contrast}`,
    });

    return {
      shotResults: {
        [shot.id]: { ...st.shotResults[shot.id], sound, score, color } as ShotResult,
      },
    };
  }

  /* ── 4. Editor — final critique & manifest ───────────────────────────── */
  async function editor(st: St): Promise<Up> {
    emit({ type: "agent", agent: "Editor", status: "start" });
    const allShots = st.shots;
    const notes = allShots.length
      ? await editFilm(allShots, st.shotResults)
      : { pace: "", transitions: "", note: "No shots produced." };

    const manifest: FilmManifest = {
      logline: st.treatment!.logline,
      shots: st.shots.map((shot) => ({
        shot,
        prompt: st.shotResults[shot.id]?.prompt ?? "",
        render: st.shotResults[shot.id]?.render,
      })),
      provider: _provider.name,
      editNote: `${notes.pace} ${notes.transitions} ${notes.note}`,
      createdAt: new Date().toISOString(),
    };

    emit({ type: "agent", agent: "Editor", status: "done", message: notes.note });
    emit({ type: "film", manifest });
    return { manifest };
  }

  /* ── Retry / Advance helpers ──────────────────────────────────────────── */

  /** Bump revision counter, then graph routes back to cinematographer. */
  async function retryShot(st: St): Promise<Up> {
    const shot = currentShot(st);
    const id = shot.id;
    const rev = (st.shotRevisions[id] ?? 0) + 1;
    emit({
      type: "agent",
      agent: "Director",
      status: "start",
      message: `shot ${shot.index + 1} — retake ${rev}`,
    });
    emit({
      type: "agent",
      agent: "Director",
      status: "done",
      message: `Re-shooting shot ${shot.index + 1} (take ${rev})`,
    });
    return { shotRevisions: { [id]: rev } };
  }

  /** Increment shot index — next conditional edge decides where to go. */
  async function advanceShot(_st: St): Promise<Up> {
    return { currentShotIndex: _st.currentShotIndex + 1 };
  }

  /* ── Conditional routers ──────────────────────────────────────────────── */

  /**
   * After post-production: decide whether this shot passes QC, needs a retake,
   * or must be skipped due to repeated failures.
   */
  function qcRouter(st: St): string {
    const shot = currentShot(st);
    if (!shot) return "editor";
    const result = st.shotResults[shot.id];
    const revisions = st.shotRevisions[shot.id] ?? 0;

    if (result?.render) return "advanceShot";
    if (revisions < st.maxRevisions) return "retryShot";
    return "advanceShot";
  }

  /**
   * After advancing the shot index: are there more shots to process,
   * or is it time for the Editor's final review?
   */
  function advanceRouter(st: St): string {
    return st.currentShotIndex < st.shots.length ? "cinematographer" : "editor";
  }

  /* ── Build graph ─────────────────────────────────────────────────────── */
  const builder = new StateGraph(FilmState)
    .addNode("screenwriter", screenwriter)
    .addNode("directorNode", directorNode)
    .addNode("cinematographer", cinematographer)
    .addNode("renderer", renderer)
    .addNode("postProduction", postProduction)
    .addNode("retryShot", retryShot)
    .addNode("advanceShot", advanceShot)
    .addNode("editor", editor)
    .addEdge(START, "screenwriter")
    .addEdge("screenwriter", "directorNode")
    .addEdge("directorNode", "cinematographer")
    .addEdge("cinematographer", "renderer")
    .addEdge("renderer", "postProduction")
    .addConditionalEdges("postProduction", qcRouter as (st: St) => string)
    .addEdge("retryShot", "cinematographer")
    .addConditionalEdges("advanceShot", advanceRouter as (st: St) => string)
    .addEdge("editor", END);

  return builder.compile();
}
