import { runPipeline } from "@/lib/pipeline/orchestrator";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  let idea = "";
  let provider = "simulated";
  let aspect = "16:9";
  let targetLength = "60s";
  try {
    const body = (await req.json()) as { idea?: string; provider?: string; aspect?: string; targetLength?: string };
    idea = body.idea?.trim() ?? "";
    provider = body.provider ?? "simulated";
    aspect = body.aspect ?? "9:16";
    targetLength = body.targetLength ?? "5s";
  } catch {
    /* fall through to validation */
  }
  if (!idea) {
    return new Response(JSON.stringify({ error: "idea required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const event of runPipeline(idea, provider, aspect, targetLength)) {
          send(event);
        }
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
