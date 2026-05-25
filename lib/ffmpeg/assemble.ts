import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { FilmManifest } from "@/lib/pipeline/types";

const RENDERS_DIR = join(process.cwd(), "public", "renders");

function dataUrlToSvg(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  const encoded = dataUrl.slice(comma + 1);
  return decodeURIComponent(encoded);
}

function svgDimensions(svgPath: string): { w: number; h: number } {
  const content = readFileSync(svgPath, "utf-8");
  const wm = content.match(/width="(\d+)"/);
  const hm = content.match(/height="(\d+)"/);
  if (wm && hm) return { w: parseInt(wm[1]), h: parseInt(hm[1]) };
  const vm = content.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (vm) return { w: parseInt(vm[1]), h: parseInt(vm[2]) };
  return { w: 1280, h: 720 };
}

function writeFallbackSvg(path: string, desc: string, w = 1280, h = 720) {
  const safe = desc
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  writeFileSync(
    path,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#1a1a2e"/>
  <text x="${w / 2}" y="${h / 2}" text-anchor="middle" fill="#888" font-family="system-ui" font-size="28">${safe}</text>
</svg>`,
  );
}

function download(url: string, dest: string) {
  execSync(`curl -sL -o "${dest}" "${url}"`, { timeout: 60_000 });
}

export function assembleFilm(manifest: FilmManifest): string {
  mkdirSync(RENDERS_DIR, { recursive: true });

  const slug =
    manifest.logline
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "film";
  const ts = Date.now();
  const filmName = `film-${slug}-${ts}.mp4`;
  const outputPath = join(RENDERS_DIR, filmName);
  const tmpDir = join(RENDERS_DIR, `tmp-${ts}`);
  mkdirSync(tmpDir, { recursive: true });

  const segments: string[] = [];

  for (let i = 0; i < manifest.shots.length; i++) {
    const { shot, render } = manifest.shots[i];
    const segPath = join(tmpDir, `seg-${i}.mp4`);

    if (render?.url && !render.url.startsWith("data:")) {
      let videoPath: string;
      if (render.url.startsWith("/renders/")) {
        /* Already downloaded by orchestrator — use local file directly. */
        videoPath = join(process.cwd(), "public", render.url);
      } else {
        /* Remote URL — download to tmp dir. */
        videoPath = join(tmpDir, `video-${i}.mp4`);
        download(render.url, videoPath);
      }
      if (existsSync(videoPath)) {
        execSync(
          `ffmpeg -y -i "${videoPath}" -c copy -an -t ${Math.max(2, shot.durationSec)} "${segPath}" 2>/dev/null`,
        );
        segments.push(segPath);
        continue;
      }
    }

    /* SVG or fallback — convert to PNG then loop into an MP4 segment. */
    const svgPath = join(tmpDir, `shot-${i}.svg`);
    const pngPath = join(tmpDir, `shot-${i}.png`);

    if (render?.url?.startsWith("data:image/svg")) {
      writeFileSync(svgPath, dataUrlToSvg(render.url));
    } else {
      writeFallbackSvg(svgPath, shot.description);
    }

    const { w, h } = svgDimensions(svgPath);
    execSync(`rsvg-convert -w ${w} -h ${h} "${svgPath}" > "${pngPath}"`);
    execSync(
      `ffmpeg -y -loop 1 -i "${pngPath}" -c:v libx264 -t ${Math.max(2, shot.durationSec)} -pix_fmt yuv420p -r 24 -preset ultrafast "${segPath}" 2>/dev/null`,
    );
    segments.push(segPath);
  }

  const concatList = segments.map((s) => `file '${s}'`).join("\n");
  writeFileSync(join(tmpDir, "segments.txt"), concatList);
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${tmpDir}/segments.txt" -c copy "${outputPath}" 2>/dev/null`,
  );

  rmSync(tmpDir, { recursive: true, force: true });
  return `/renders/${filmName}`;
}
