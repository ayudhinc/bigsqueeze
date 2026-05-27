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
import { readdirSync, renameSync } from "fs";

const OUT_DIR = "/tmp";
const VIDEO_PATH = `${OUT_DIR}/devnet-demo-${Date.now()}`;

const LOGLINE = "A cyberpunk street artist leaves her mark on a city that watches back.";
const STUDIO_URL = "http://localhost:3005/studio";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\n  Recording demo to: ${VIDEO_PATH}.webm\n`);

  const browser = await chromium.launch({
    headless: false,
    args: ["--window-size=1600,1000"],
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    recordVideo: { dir: OUT_DIR, size: { width: 1600, height: 1000 } },
  });

  const page = await context.newPage();

  // ── 1. Navigate to Studio ──────────────────────────────────────────────
  console.log("  [1/7]  Navigating to Studio …");
  await page.goto(STUDIO_URL, { waitUntil: "networkidle" });
  await sleep(2000);

  // ── 2. Set duration to 15s ─────────────────────────────────────────────
  console.log("  [2/7]  Setting target duration to 15s …");
  const durationSelect = page.locator('select.provider-select');
  await durationSelect.scrollIntoViewIfNeeded();
  await sleep(300);
  await durationSelect.focus();
  await sleep(200);
  await durationSelect.selectOption("15s");
  await sleep(600);

  // ── 3. Select all existing text in the logline input, then type ────────
  console.log("  [3/7]  Typing logline …");
  const input = page.locator('input[placeholder*="getaway driver"]');
  await input.click();
  await sleep(200);
  // Select all existing text
  await page.keyboard.press("Meta+a");
  await sleep(200);
  // Delete it
  await page.keyboard.press("Backspace");
  await sleep(300);
  // Type new logline character by character
  for (const char of LOGLINE) {
    await page.keyboard.type(char, { delay: 30 + Math.random() * 25 });
  }
  await sleep(800);

  // ── 4. Click GENERATE ──────────────────────────────────────────────────
  console.log("  [4/7]  Clicking GENERATE …");
  const genBtn = page.locator('button:has-text("GENERATE")');
  await genBtn.click();

  // ── 5. Watch pipeline live ─────────────────────────────────────────────
  console.log("  [5/7]  Pipeline running …");

  // Wait for first agent to turn WORKING
  await page.waitForSelector('.agents .status:has-text("WORKING")', { timeout: 30000 });
  await sleep(3000);

  // Wait for pipeline to finish — film player video element
  try {
    await page.waitForSelector('.film-player video', { timeout: 300_000 });
    console.log("  [6/7]  Pipeline complete — film player visible");
  } catch {
    console.log("  [6/7]  Trying download button instead …");
    await page.waitForSelector('.dl-btn', { timeout: 300_000 });
  }
  await sleep(3000);

  // ── 6. Click download ──────────────────────────────────────────────────
  console.log("  [7/7]  Clicking download …");
  const dlBtn = page.locator('.dl-btn');
  if (await dlBtn.isVisible()) {
    await dlBtn.click();
    await sleep(1500);
  }

  // ── 7. Close — Playwright finalises the video ──────────────────────────
  await context.close();
  await browser.close();

  // Rename the auto-generated video to our predictable name
  const files = readdirSync(OUT_DIR).filter((f) => f.startsWith("page@") && f.endsWith(".webm"));
  if (files.length) {
    const src = `${OUT_DIR}/${files.sort().reverse()[0]}`;
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
