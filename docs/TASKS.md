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
- [ ] Render progress: `scale(1 + scrub*0.04)` at 4% max zoom is imperceptible — use visible progress bar or overlay
- [ ] Phase indicator: show current stage (planning → producing → mixing → editing) in the UI
- [x] Editor note text mismatch: says "ProRes 422 HQ + H.264" but output is MP4
- [x] Playhead static during planning — should show some activity (now shows agent name + "Awaiting shots" in live mode)
- [ ] Filmstrip empty during planning/mixing/editing — should light up progressively
- [ ] Unmount safety: timer chain not cleaned up if component unmounts mid-demo

## 7. Real LTX-2
- [x] Wire chosen provider (fal or runpod) end-to-end [needs keys]
- [x] Provider dropdown in Studio UI (simulated / fal/seedance-2.0 / fal/ltx-2 / runpod/ltx-2 disabled)
- [ ] Reference-image conditioning for shot consistency

## 8. Polish / demo
- [x] Seed example loglines
- [ ] Pre-rendered fallback for stage demo (latency safety)
- [ ] README + run instructions
- [ ] (optional) Deploy to Vercel
