# Big Squeeze — Architecture & Stack

> Agent-swarm film maker. Hackathon entry for DevNetwork [AI+ML] 2026.
> **Separate from Backlot** (Backlot governs studio *production*; this is a focused
> agent-swarm *film maker* demo).

## What it is
An **agent-swarm video film maker**. Input: a logline/idea (or a script).
Output: a finished short film, generated **shot-by-shot with LTX-2** and assembled
with audio. The agent swarm is the engine; the user sees a film maker with a
**live timeline**.

## Principles
- **Keyless simulation mode by default.** The whole pipeline runs end-to-end with
  zero credentials/GPU (deterministic placeholder clips), so it *always* demos.
  (Pattern borrowed from Backlot.)
- **Provider abstraction for generation.** One interface, swappable adapters
  (`simulated | fal | runpod`) — switch with an env var, no code change.
- **Demo-first, single deployable app.**

## Stack
- **Language:** TypeScript, Node ≥24 LTS.
- **Package manager:** pnpm — **enforced** (`preinstall: only-allow pnpm`,
  `engine-strict`, `engines`, `packageManager` pinned once local version confirmed).
- **Framework:** Next.js (App Router) — single full-stack app (UI + route handlers).
  Vercel-deployable.
- **UI:** React + Tailwind CSS (shadcn/ui optional).
- **Agents/LLM:** Vercel AI SDK; models via AI Gateway (`"provider/model"` strings).
  Reasoning model swappable to **Nemotron-on-Crusoe** for the sovereign sponsor story.
- **Video generation — LTX-2 behind a `VideoProvider` interface:**
  - `simulated` (default, keyless) — deterministic placeholder clips (color cards /
    gradients + prompt overlay → mp4) so the pipeline runs with no GPU.
  - `fal` — hosted LTX-2.3 (image/text-to-video) via fal.ai. Fastest real path.
  - `runpod` — self-hosted LTX-2 on RunPod (serverless worker/pod). Sovereign + sponsor fit.
- **Assembly:** ffmpeg (concat shots, mux audio/score → final mp4).
- **Audio:** LTX-2 native per-shot audio; optional music bed (provider-abstracted).
- **Live updates:** streaming/SSE → UI per agent step + per-shot render state
  (`queued → rendering → ready → failed`).
- **Storage/state:** filesystem + in-memory for the MVP (output to `public/renders`).
  No DB for the demo.
- **Config:** `.env` — `VIDEO_PROVIDER`, `LLM`, provider keys. Never commit secrets.

## The swarm (pipeline stages)
1. **Writer** — idea → logline + short treatment + beats.
2. **Shot Breakdown** — treatment → ordered shot list (desc, duration, camera, mood).
3. **Prompt Smith** — per shot → an LTX-2 prompt (+ optional reference image for
   character/style consistency).
4. **Renderer** (parallel) — each shot → LTX-2 clip via `VideoProvider` (native audio).
5. **Critic / QC** — reviews shots vs. the brief; flags/retries weak shots (bounded).
6. **Assembler** — stitch shots + score → final film (ffmpeg).

A **Director/coordinator** sequences the stages and streams progress to the UI.

> Known-hard part: **shot-to-shot consistency.** v1 leans on reference-image
> conditioning + style memory; rough output reads as *animatic/concept*, not final.

## Data flow
`idea → Writer → treatment → ShotBreakdown → shots[] → (PromptSmith → Renderer →
Critic) per shot, streamed → Assembler → film.mp4 + manifest.json`

## Repo layout (target)
```
app/                Next.js App Router (UI + API routes)
  api/...           orchestration endpoints (streaming)
lib/
  agents/           writer, shotBreakdown, promptSmith, critic, director
  providers/
    video/          interface.ts, simulated.ts, fal.ts, runpod.ts, index.ts
    llm.ts          AI SDK wrapper / model selection
  pipeline/         orchestrator.ts, types.ts
  events/           sse/stream helpers
  ffmpeg/           assemble.ts
public/renders/     demo output
docs/               ARCHITECTURE.md, TASKS.md
```

## Sponsor mapping (optional, NOT load-bearing)
- **RunPod** — self-host LTX-2 (`runpod` provider) → sovereign generation.
- **Crusoe** — agent reasoning on Nemotron → multi-agent on sovereign infra.

## Open decisions (to confirm)
- LTX-2 access route: **fal** (fast) vs **RunPod** self-host (sovereign/sponsor).
  Start `simulated`, then wire the chosen real one.
- shadcn/ui vs hand-rolled components.
- SSE vs AI SDK streaming primitives for the timeline.
