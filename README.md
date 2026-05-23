# Big Squeeze

A Big Squeeze is a writers' room, camera crew, sound stage, and edit bay — staffed by autonomous agents. You watch them work on a live timeline.

Built for the DevNetwork AI+ML Hack 2026.

## How it works

Paste a logline (or pick a preset). Big Squeeze runs a 7-agent LangGraph pipeline that plans, generates, and assembles a short film in real time.

**Pipeline:**

| # | Agent | Role |
|---|-------|------|
| 1 | Screenwriter | Expands a logline into a treatment (synopsis + beats) |
| 2 | Director | Breaks treatment into a shot list (camera, mood, duration) |
| 3 | Cinematographer | Writes text-to-video prompts for each shot |
| 4 | Sound Designer | Generates atmos, foley, and mix notes |
| 5 | Composer | Scores each shot (theme, instrumentation, tempo) |
| 6 | Colorist | Grades each shot (palette, contrast) |
| 7 | Editor | Reviews the full cut for pacing and continuity |

## Stack

- **Framework:** Next.js 16 (App Router)
- **Pipeline:** LangGraph (StateGraph)
- **Video:** fal.ai (LTX-2 / Seedance 2.0)
- **LLM:** AI Gateway / Groq / OpenAI
- **Assembly:** ffmpeg + rsvg-convert (SVG → PNG → MP4)
- **Styling:** Hand-written CSS (no Tailwind in components)
- **Language:** TypeScript, strict mode
- **Package manager:** pnpm

## Getting started

```bash
pnpm install
pnpm dev
```

Opens at `http://localhost:3000`.

### Configuration

Copy `.env.example` to `.env` and set at least one:

```
LLM_PROVIDER=groq              # groq | openai | gateway
GROQ_API_KEY=...               # needed when LLM_PROVIDER=groq
VIDEO_PROVIDER=simulated       # simulated | fal

# For real video generation:
FAL_KEY=key_id:key_secret
```

No keys are required — the pipeline runs keylessly with deterministic fallbacks and simulated video.

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | tsc --noEmit |

## Project structure

```
├── app/
│   ├── page.tsx                # Landing page with preview Studio
│   ├── studio/page.tsx         # Full live Studio
│   └── api/
│       ├── direct/route.ts     # SSE pipeline endpoint
│       └── renders/route.ts    # Lists rendered MP4s
├── components/
│   ├── studio.tsx              # Main Studio (preview/demo/live)
│   └── bigsqueeze-app.tsx      # Landing page app shell
├── lib/
│   ├── agents/                 # 7 agent implementations
│   ├── pipeline/
│   │   ├── graph.ts            # LangGraph state definition
│   │   └── orchestrator.ts     # SSE event loop
│   ├── providers/
│   │   ├── llm.ts              # LLM routing (gateway/groq/openai)
│   │   └── video/              # Video providers (fal, simulated, runpod)
│   └── ffmpeg/                 # Assembly via ffmpeg
├── public/
│   └── renders/                # Generated MP4s (gitignored)
└── docs/
    └── TASKS.md                # Build checklist
```

## Architecture

The pipeline runs as a LangGraph `StateGraph` with 7 named nodes. Each node emits typed PipelineEvents that the Studio UI consumes via SSE. The orchestrator runs the graph in a background promise while yielding events from a polling channel loop.

Every agent has two paths:
- **LLM path** — calls Groq/OpenAI/AI Gateway via the `ai` SDK
- **Fallback path** — produces deterministic output when no key is set or when rate-limited

The video provider is swappable. `SimulatedVideoProvider` renders animated SVGs keylessly; `FalVideoProvider` calls fal.ai for real video generation.
