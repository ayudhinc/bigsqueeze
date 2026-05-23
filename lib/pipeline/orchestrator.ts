import type { PipelineEvent, FilmManifest, ShotRender } from "./types";
import { writeTreatment } from "@/lib/agents/writer";
import { breakIntoShots } from "@/lib/agents/shotBreakdown";
import { writeShotPrompt } from "@/lib/agents/promptSmith";
import { critiqueShot } from "@/lib/agents/critic";
import { getVideoProvider } from "@/lib/providers/video";

/**
 * The Director: sequences the swarm and yields a stream of events for the live
 * timeline. Writer → Shot Designer → per shot (Prompt Smith → Render → Critic).
 */
export async function* runPipeline(idea: string): AsyncGenerator<PipelineEvent> {
  const provider = getVideoProvider();

  try {
    // 1. Writer
    yield { type: "agent", agent: "Writer", status: "start" };
    const treatment = await writeTreatment(idea);
    yield { type: "treatment", treatment };
    yield { type: "agent", agent: "Writer", status: "done", message: treatment.logline };

    // 2. Shot Designer
    yield { type: "agent", agent: "Shot Designer", status: "start" };
    const shots = await breakIntoShots(treatment);
    yield { type: "shots", shots };
    yield { type: "agent", agent: "Shot Designer", status: "done", message: `${shots.length} shots` };

    const style = `${treatment.logline} — ${treatment.synopsis}`;
    const manifestShots: FilmManifest["shots"] = [];

    // 3. Per shot: Prompt Smith → Render → Critic
    for (const shot of shots) {
      yield { type: "shot", shotId: shot.id, status: "queued" };

      yield { type: "agent", agent: "Prompt Smith", status: "start", message: `shot ${shot.index + 1}` };
      const prompt = await writeShotPrompt(shot, style);
      yield { type: "agent", agent: "Prompt Smith", status: "done", message: prompt };

      yield { type: "shot", shotId: shot.id, status: "rendering" };
      let render: ShotRender | undefined;
      try {
        render = await provider.generateShot({ prompt, shot });
        yield { type: "shot", shotId: shot.id, status: "ready", render };
      } catch (err) {
        yield { type: "shot", shotId: shot.id, status: "failed" };
        yield { type: "error", message: `Shot ${shot.index + 1} render failed: ${(err as Error).message}` };
      }

      yield { type: "agent", agent: "Critic", status: "start", message: `shot ${shot.index + 1}` };
      const note = await critiqueShot(shot, prompt);
      yield { type: "agent", agent: "Critic", status: "done", message: note.note };

      manifestShots.push({ shot, prompt, render });
    }

    const manifest: FilmManifest = {
      logline: treatment.logline,
      shots: manifestShots,
      provider: provider.name,
      createdAt: new Date().toISOString(),
    };
    yield { type: "film", manifest };
  } catch (err) {
    yield { type: "error", message: (err as Error).message };
  }
}
