import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RENDERS_DIR = join(process.cwd(), "public", "renders");

export const runtime = "nodejs";

export async function GET() {
  try {
    const files = readdirSync(RENDERS_DIR).filter((f) => f.endsWith(".mp4"));
    const renders = files
      .map((f) => {
        const p = join(RENDERS_DIR, f);
        const s = statSync(p);
        return { file: f, url: `/renders/${f}`, size: s.size, mtime: s.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return Response.json(renders);
  } catch {
    return Response.json([]);
  }
}
