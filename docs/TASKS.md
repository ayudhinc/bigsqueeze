# Filmwright — Build TODO

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
- [ ] ffmpeg concat + audio mux → `film.mp4`
- [ ] Output `manifest.json` (shots, prompts, providers, timings)

## 6. UI (the demo)
- [x] Input: logline/script (Studio logline bar + preset suggestions)
- [x] Live timeline: agent feed + per-shot render cards (queued→rendering→ready)
- [ ] Wire Studio to real pipeline (`/studio` still runs scripted sim, not `POST /api/direct`)
- [ ] Final film player + download

## 7. Real LTX-2
- [ ] Wire chosen provider (fal or runpod) end-to-end [needs keys]
- [ ] Reference-image conditioning for shot consistency

## 8. Polish / demo
- [x] Seed example loglines
- [ ] Pre-rendered fallback for stage demo (latency safety)
- [ ] README + run instructions
- [ ] (optional) Deploy to Vercel
