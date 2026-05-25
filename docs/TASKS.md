# Big Squeeze — Build TODO

On-disk source of truth for the build sequence. Check items off as we go.

## 0. Foundation
- [x] Architecture/stack doc on disk (`docs/ARCHITECTURE.md`)
- [x] pnpm enforcement (`package.json` preinstall/engines, `.npmrc`, `.nvmrc`)
- [x] This TODO on disk
- [x] Confirm local node/pnpm versions; pin `packageManager` field

## 1. Scaffold
- [x] Next.js App Router + TS + Tailwind, deps added via pnpm (no create-next-app)
- [x] Base layout, globals, dark theme
- [x] AI SDK + zod installed
- [x] `.env.example`: `VIDEO_PROVIDER`, `LLM`, provider keys

## 2. Provider abstraction (generation)
- [x] `VideoProvider` interface: `generateShot(prompt, opts) → { videoUrl, audioUrl, meta }`
- [x] `simulated` adapter (keyless, deterministic placeholder clips)
- [x] `fal` adapter (LTX-2.3 hosted)        [needs FAL key]
- [ ] `runpod` adapter (self-host LTX-2)     [needs endpoint]
- [x] LLM wrapper (AI SDK, gateway model strings)
- [x] Groq inference via `@ai-sdk/openai` (OpenAI-compatible)  [needs GROQ_API_KEY]

## 3. The swarm (7 agents)
- [x] Screenwriter (idea → treatment + beats)
- [x] Director (coverage, shot blocks, lens/blocking choices)
- [x] Cinematographer (shot framing, lighting, camera motion)
- [x] Sound Designer (foley, atmos, ADR, stems)
- [x] Composer (score, theme variations, stems)
- [x] Colorist (grade, LUTs, contrast, skin tones)
- [x] Editor (assemble, pace, master — ProRes, H.264, captions)
- [x] Director/orchestrator (sequences, streams progress)

## 4. Pipeline + streaming
- [x] Orchestrator endpoint (`POST /api/direct`, SSE stream)
- [x] Studio route (`/studio`) with agent feed + timeline UI (scripted sim, not yet wired)

## 5. Assembly
- [x] ffmpeg concat + audio mux → `film.mp4`
- [x] Output `manifest.json` (shots, prompts, providers, timings)

## 6. UI (the demo)
- [x] Input: logline/script (Studio logline bar + preset suggestions)
- [x] Live timeline: agent feed + per-shot render cards (queued→rendering→ready)
- [x] Wire Studio to real pipeline (`/studio` runs `POST /api/direct` when `mode="live"`)
- [x] Final film player + download

## 6.1 Demo UI quality fixes
- [x] Timing: shots render too fast (1.9s each, 7 steps at 180ms) — slow down to feel like real generation
- [x] Render progress: sweep overlay replaces imperceptible 4% zoom; visible progress bar in overlay
- [x] Phase indicator: show current stage (planning → producing → mixing → editing) in the UI
- [x] Editor note text mismatch: says "ProRes 422 HQ + H.264" but output is MP4
- [x] Playhead static during planning — should show some activity (now shows agent name + "Awaiting shots" in live mode)
- [x] Filmstrip empty during planning/mixing/editing — should light up progressively (now shows pending/done cells in all phases)
- [x] Unmount safety: timer chain not cleaned up if component unmounts mid-demo

## 7. Real LTX-2
- [x] Wire chosen provider (fal or runpod) end-to-end [needs keys]
- [x] Provider dropdown in Studio UI (simulated / fal/seedance-2.0 / fal/ltx-2)
- [x] Reference-image conditioning for shot consistency
- [x] Model-specific fal parameters (LTX-2 uses duration/resolution, Seedance uses aspect_ratio)
- [x] Fix stale closure: provider/format/length/resolution not reflected in POST body

## 7.1 Pipeline plumbing
- [x] Shot download: save each render to public/renders/{runId}/shot-{n}.mp4 before assembly
- [x] Resolution parameter threaded through Studio → API → orchestrator → graph → providers
- [x] Even-dimension guard for libx264 compatibility (odd widths like 405 → 406)
- [x] SVG assembly uses actual SVG dimensions instead of hardcoded 1280x720
- [x] Simulated SVG animation timing matches shot.durationSec

## 7.2 UI enhancements
- [x] Scrollable process log (replaces single typing-note)
- [x] Timeline V1 clips clickable — sets active shot in viewport
- [x] Target length dropdown moved to its own row to prevent overflow
- [x] Removed disabled Runpod option; default provider = simulated

## 8. Polish / demo
- [x] Seed example loglines
- [ ] Pre-rendered fallback for stage demo (latency safety)
- [ ] README + run instructions
- [ ] (optional) Deploy to Vercel
