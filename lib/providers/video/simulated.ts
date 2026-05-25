import type { VideoProvider, GenerateShotInput } from "./interface";
import type { ShotRender } from "@/lib/pipeline/types";

/**
 * Keyless, deterministic video provider. Produces an animated SVG "clip" per
 * shot so the entire pipeline runs end-to-end with zero credentials or GPU.
 * Same role as Backlot's simulation mode: identical interface, swap to `fal`
 * via the VIDEO_PROVIDER env var with no code change.
 */
export class SimulatedVideoProvider implements VideoProvider {
  readonly name = "simulated";

  async generateShot(input: GenerateShotInput): Promise<ShotRender> {
    const { shot, prompt } = input;
    const h = hashString(`${prompt}:${shot.index}`);
    const hue = h % 360;
    const hue2 = (hue + 40) % 360;

    const { w, h: svgH } = aspectDimensions(input.aspect ?? "16:9", input.resolution ?? "720p");
    const dur = Math.max(2, shot.durationSec);
    const durStr = `${dur}s`;
    const caption = wrap(escapeXml(shot.description || prompt), Math.round(w / 30))
      .map(
        (ln, i) =>
          `<text x="${w * 0.05}" y="${svgH * 0.5 + i * (svgH * 0.05)}" font-family="ui-sans-serif, system-ui" font-size="${svgH * 0.036}" fill="rgba(255,255,255,0.92)">${ln}</text>`,
      )
      .join("");

    const cx = w * 0.77, cy = svgH * 0.28, r = svgH * 0.17;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${svgH}" viewBox="0 0 ${w} ${svgH}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 70% 22%)">
        <animate attributeName="stop-color" values="hsl(${hue} 70% 22%);hsl(${hue2} 70% 30%);hsl(${hue} 70% 22%)" dur="${durStr}" repeatCount="indefinite"/>
      </stop>
      <stop offset="1" stop-color="hsl(${hue2} 70% 14%)"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${svgH}" fill="url(#g)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${hue2} 80% 60% / 0.22)">
    <animate attributeName="cy" values="${cy};${cy + svgH * 0.07};${cy}" dur="${durStr}" repeatCount="indefinite"/>
  </circle>
  <text x="${w * 0.05}" y="${svgH * 0.15}" font-family="ui-monospace, monospace" font-size="${svgH * 0.028}" fill="rgba(255,255,255,0.5)" letter-spacing="3">SHOT ${String(shot.index + 1).padStart(2, "0")} · ${shot.durationSec}s · SIM</text>
  ${caption}
  <text x="${w * 0.05}" y="${svgH * 0.92}" font-family="ui-monospace, monospace" font-size="${svgH * 0.022}" fill="rgba(255,255,255,0.4)">${escapeXml([shot.camera, shot.mood].filter(Boolean).join(" · "))}</text>
</svg>`;

    // Simulate render latency so the live timeline feels real.
    await sleep(500 + (h % 900));

    return {
      shotId: shot.id,
      url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      kind: "svg",
      durationSec: shot.durationSec,
      provider: this.name,
      meta: { simulated: true, hue },
    };
  }
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (`${line} ${w}`.trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = `${line} ${w}`.trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function aspectDimensions(aspect: string, resolution: string): { w: number; h: number } {
  const parts = aspect.split(":").map(Number);
  const ratio = parts[0] / parts[1];
  const targetH = parseInt(resolution.replace("p", ""), 10) || 720;
  let w = Math.round(targetH * ratio);
  let h = targetH;
  if (w % 2) w++;
  if (h % 2) h++;
  return { w, h };
}
