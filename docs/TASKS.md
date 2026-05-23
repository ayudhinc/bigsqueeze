# Filmwright — Build TODO

On-disk source of truth for the build sequence. Check items off as we go.

## 0. Foundation  ← (this step)
- [x] Architecture/stack doc on disk (`docs/ARCHITECTURE.md`)
- [x] pnpm enforcement (`package.json` preinstall/engines, `.npmrc`, `.nvmrc`)
- [x] This TODO on disk
- [ ] Confirm local node/pnpm versions; pin `packageManager` field

## 1. Scaffold
- [ ] Next.js App Router + TS + Tailwind, deps added via pnpm (no create-next-app)
- [ ] Base layout, globals, dark theme
- [ ] AI SDK + zod installed
- [ ] `.env.example`: `VIDEO_PROVIDER`, `LLM`, provider keys

## 2. Provider abstraction (generation)
- [ ] `VideoProvider` interface: `generateShot(prompt, opts) → { videoUrl, audioUrl, meta }`
- [ ] `simulated` adapter (keyless, deterministic placeholder clips)
- [ ] `fal` adapter (LTX-2.3 hosted)        [needs FAL key]
- [ ] `runpod` adapter (self-host LTX-2)     [needs endpoint]
- [ ] LLM wrapper (AI SDK, gateway model strings)

## 3. The swarm (agents)
- [ ] Writer (idea → treatment + beats)
- [ ] Shot Breakdown (→ typed/zod shot list)
- [ ] Prompt Smith (shot → LTX-2 prompt)
- [ ] Critic/QC (review + bounded retry)
- [ ] Director/orchestrator (sequences, streams progress)

## 4. Pipeline + streaming
- [ ] Orchestrator endpoint (stream events: agent steps + shot states)
- [ ] SSE/stream plumbing to UI

## 5. Assembly
- [ ] ffmpeg concat + audio mux → `film.mp4`
- [ ] Output `manifest.json` (shots, prompts, providers, timings)

## 6. UI (the demo)
- [ ] Input: logline/script
- [ ] Live timeline: agent feed + per-shot render cards (queued→rendering→ready)
- [ ] Final film player + download

## 7. Real LTX-2
- [ ] Wire chosen provider (fal or runpod) end-to-end
- [ ] Reference-image conditioning for shot consistency

## 8. Polish / demo
- [ ] Seed example loglines
- [ ] Pre-rendered fallback for stage demo (latency safety)
- [ ] README + run instructions
- [ ] (optional) Deploy to Vercel
