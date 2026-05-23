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

    const caption = wrap(escapeXml(shot.description || prompt), 42)
      .map(
        (ln, i) =>
          `<text x="60" y="${320 + i * 36}" font-family="ui-sans-serif, system-ui" font-size="26" fill="rgba(255,255,255,0.92)">${ln}</text>`,
      )
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 70% 22%)">
        <animate attributeName="stop-color" values="hsl(${hue} 70% 22%);hsl(${hue2} 70% 30%);hsl(${hue} 70% 22%)" dur="6s" repeatCount="indefinite"/>
      </stop>
      <stop offset="1" stop-color="hsl(${hue2} 70% 14%)"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <circle cx="980" cy="200" r="120" fill="hsl(${hue2} 80% 60% / 0.22)">
    <animate attributeName="cy" values="200;250;200" dur="5s" repeatCount="indefinite"/>
  </circle>
  <text x="60" y="110" font-family="ui-monospace, monospace" font-size="20" fill="rgba(255,255,255,0.5)" letter-spacing="3">SHOT ${String(shot.index + 1).padStart(2, "0")} · ${shot.durationSec}s · SIM</text>
  ${caption}
  <text x="60" y="660" font-family="ui-monospace, monospace" font-size="16" fill="rgba(255,255,255,0.4)">${escapeXml([shot.camera, shot.mood].filter(Boolean).join(" · "))}</text>
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
