# DevNet — Hermes-style Agent Film Studio

A fully autonomous multi-agent film studio. Paste a logline — 7 specialized AI agents (Writer, Director, DP, Editor, Composer, Sound Designer, Colorist) collaborate in real time to produce a complete short film, shot by shot.

Built for the **DevNetwork AI+ML Hack 2026** (Crusoe Challenge: *Build a Hermes / NemoClaw agent running Nvidia Nemotron on Crusoe Cloud Managed Inference*).

[![Demo](https://img.shields.io/badge/demo-live-brightgreen)](#)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%C2%B7%20LangGraph%20%C2%B7%20Crusoe%20Nemotron-blue)](#)

## How it works

Each agent is an independent LLM-powered node in a **LangGraph StateGraph**. The pipeline runs autonomously — no human writes a line of production code:

| Agent | Role |
|-------|------|
| **Screenwriter** | Expands a logline → treatment (logline, synopsis, story beats) |
| **Director** | Breaks treatment → shot list (description, duration, camera, mood) |
| **Cinematographer (DP)** | Writes detailed text-to-video / image-to-video prompts per shot |
| **Sound Designer** | Generates atmos, foley, and mix notes per shot |
| **Composer** | Scores each shot (theme, instrumentation, BPM) |
| **Colorist** | Grades each shot (palette, contrast, lift) |
| **Editor** | Reviews the full cut and writes an edit note |

The agents follow a **Hermes-style architecture**: structured outputs via Zod schemas, tool-use patterns, deterministic fallbacks when no LLM is available, and a real-time event stream that lets you watch them work.

## Demo

```
1. Open the Studio UI
2. Paste a logline: "A lonely robot tends a garden on Mars"
3. Watch the agents plan → render → assemble in real time
4. Play the finished MP4
```

The Studio shows a live timeline with clickable shot clips, a viewport with per-shot previews, a scrolling agent process log, and a kill switch to abort any run.

## Crusoe / Nemotron integration

The pipeline uses **Nvidia Nemotron-3-Nano-30B-A3B-FP8** via **Crusoe Cloud Managed Inference** as its LLM backend. The Crusoe API is OpenAI-compatible — the integration is a single provider case in `lib/providers/llm.ts`:

```typescript
case "crusoe": {
  if (!_crusoe)
    _crusoe = createOpenAI({
      name: "crusoe",
      baseURL: process.env.CRUSOE_BASE_URL,
      apiKey: process.env.CRUSOE_API_KEY,
    });
  return _crusoe.chat(name);
}
```

Nemotron handles all 7 agent roles — from creative writing (treatment) to structured planning (shot list) to technical specification (color grading notes).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Agent Pipeline:** LangGraph (StateGraph)
- **LLM Backend:** Crusoe Cloud Managed Inference — Nvidia Nemotron-3-Nano-30B-A3B-FP8
- **LLM SDK:** Vercel AI SDK (`@ai-sdk/openai`) with structured output + text-gen fallback
- **Video Providers:** fal.ai (LTX-2, Seedance 2.0), Simulated (keyless SVGs for testing)
- **Video Assembly:** ffmpeg + rsvg-convert
- **Language:** TypeScript, strict mode
- **Package Manager:** pnpm

## Getting started

```bash
pnpm install
```

### Set environment variables

```bash
# LLM — required (the pipeline runs without it, but with fallback output)
export CRUSOE_API_KEY='your-key-with-$signs-single-quoted'
export LLM_PROVIDER=crusoe

# Video — optional (defaults to simulated, keyless)
export VIDEO_PROVIDER=simulated
# export VIDEO_PROVIDER=fal
# export FAL_KEY=key_id:key_secret
```

Start:

```bash
pnpm dev
```

Opens at `http://localhost:3005`.

> **Note:** If your Crusoe API key contains `$` signs (bcrypt hash), set it via shell `export` with single quotes — `.env` file's dotenv-expand will mangle `$` characters. See `.env.example` for details.

## Project structure

```
├── app/
│   ├── studio/page.tsx         # Live Studio UI
│   └── api/direct/route.ts     # SSE pipeline endpoint
├── components/
│   └── studio.tsx              # Main Studio component
├── lib/
│   ├── agents/                 # 7 agent implementations
│   ├── pipeline/
│   │   ├── graph.ts            # LangGraph state machine
│   │   └── orchestrator.ts     # SSE event loop
│   ├── providers/
│   │   ├── llm.ts              # LLM routing (crusoe / groq / openai / gateway)
│   │   └── video/              # Video providers (fal, simulated)
│   └── ffmpeg/                 # Film assembly
└── public/renders/             # Generated MP4s
```

## Architecture

The pipeline runs as a LangGraph `StateGraph`. Each node emits typed `PipelineEvent` objects that the Studio UI consumes via Server-Sent Events. The orchestrator runs the graph in a background promise while yielding events from a polling channel — zero buffering, the UI updates as agents complete.

Every agent has two paths:
- **LLM path** — calls `genObject()` / `genText()` which route to Crusoe Nemotron via the AI SDK
- **Fallback path** — produces deterministic output when no API key is set

`genObject()` first tries native `json_schema` mode; if unsupported (Nemotron), it falls back to text-gen + Zod parse with a recursive schema description prompt.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 3005 |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |

## License

MIT
