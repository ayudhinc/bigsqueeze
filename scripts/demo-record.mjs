/**
 * Golden-path demo recorder.
 *
 * Launches the Studio UI, enters a logline, runs the pipeline at human
 * speed, and records the entire interaction as a WebM screencast.
 *
 * Usage:
 *   1. Start the dev server:  pnpm dev   (requires CRUSOE_API_KEY in env)
 *   2. Run this script:        node scripts/demo-record.mjs
 *
 * Requires:  npx playwright install chromium
 */

import { chromium } from "playwright";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync, readdirSync, renameSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "renders");
mkdirSync(OUT_DIR, { recursive: true });

const LOGLINE = "A cyberpunk street artist leaves her mark on a city that watches back.";
const STUDIO_URL = "http://localhost:3005/studio";
const VIDEO_PATH = resolve(OUT_DIR, `demo-${Date.now()}`);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n  Recording demo to: ${VIDEO_PATH}.webm\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--window-size=1440,900"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT_DIR, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();

  // ── 1. Navigate to Studio ──────────────────────────────────────────────
  console.log("  [1/6]  Navigating to Studio …");
  await page.goto(STUDIO_URL, { waitUntil: "networkidle" });
  await sleep(1200);

  // ── 2. Type logline (character by character for human feel) ────────────
  console.log("  [2/6]  Typing logline …");
  const input = page.locator('input[placeholder*="getaway driver"]');
  await input.click();
  await sleep(300);
  for (const char of LOGLINE) {
    await page.keyboard.type(char, { delay: 20 + Math.random() * 15 });
  }
  await sleep(500);

  // ── 3. Click GENERATE ──────────────────────────────────────────────────
  console.log("  [3/6]  Clicking GENERATE …");
  const genBtn = page.locator('button:has-text("GENERATE")');
  await genBtn.click();

  // ── 4. Watch pipeline live ─────────────────────────────────────────────
  console.log("  [4/6]  Pipeline running …");

  // Wait for first agent to turn WORKING
  await page.waitForSelector('.agents .status:has-text("WORKING")', { timeout: 30000 });
  await sleep(1500);

  // Wait for pipeline to finish — film player video element
  try {
    await page.waitForSelector('.film-player video', { timeout: 300_000 });
    console.log("  [5/6]  Pipeline complete — film player visible");
  } catch {
    console.log("  [5/6]  Trying download button instead …");
    await page.waitForSelector('.dl-btn', { timeout: 300_000 });
  }
  await sleep(2000);

  // ── 5. Click download ──────────────────────────────────────────────────
  console.log("  [6/6]  Clicking download …");
  const dlBtn = page.locator('.dl-btn');
  if (await dlBtn.isVisible()) {
    await dlBtn.click();
    await sleep(1000);
  }

  // ── 6. Close — Playwright finalises the video ──────────────────────────
  await context.close();
  await browser.close();

  // Rename the auto-generated video to our predictable name
  const files = readdirSync(OUT_DIR).filter((f) => f.startsWith("page@") && f.endsWith(".webm"));
  if (files.length) {
    const src = resolve(OUT_DIR, files.sort().reverse()[0]);
    const dst = VIDEO_PATH + ".webm";
    renameSync(src, dst);
    console.log(`\n  Done — demo saved to: ${dst}\n`);
  } else {
    console.log(`\n  Done — no video file found (expected at ${VIDEO_PATH}.webm)\n`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
